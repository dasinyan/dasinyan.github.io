$(function() {

    // --- 1. 状態管理 ---
    const GAS_URL = "https://script.google.com/macros/s/AKfycbzfITxWEanzZSxhHnTsv9DUrkhHnJ91Tj8gDGYSaWY4ZrqgYRYhJHirQT7_MKIAUCzf/exec";

    let userId = localStorage.getItem("cyclogic_user_id") || (() => {
        const id = "U-" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("cyclogic_user_id", id);
        return id;
    })();

    let startTime = 0;
    let isChallengeMode = false;
    let panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9]; 
    let posMap = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let savedState = [1, 2, 3, 4, 5, 6, 7, 8, 9]; 
    let savedAnswer = [];
    let savedIsComboMode = false;
    let savedSelectedSteps = 0;
    
    let isSoundOn = true;
    let isAnimating = false;
    let currentAnswer = []; 
    let peekTimer = null;   

    let modeMoves = 0;       
    let isComboMode = false; 
    let inputBuffer = [];    
    let selectedSteps = 0; 
    let dailyTargetSteps = 3; 
    let currentDayOffset = 0; 
	let isLocked = false; // クリア後の演出用ロック
	let winAnims = []; // 祝福アニメーションを保持する配列

    const ANI_SPEED = 1.0;

    const homeColors = {
        1: "#d41616", 2: "#2a7cd9", 3: "#ffd700",
        4: "#26a261", 5: "#f7931e", 6: "#892faa",
        7: "#ff47b9", 8: "#8cc63f", 9: "#30c9ff"
    };

    const sounds = {
        push: new Audio('sound/push.mp3'),
        click: new Audio('sound/click.mp3'),
        sestart1: new Audio('sound/sestart1.mp3'),
        sestart2: new Audio('sound/sestart2.mp3'),
        sestart3: new Audio('sound/sestart3.mp3'),
        seinco1: new Audio('sound/seinco1.mp3'),
        seinco2: new Audio('sound/seinco2.mp3'),
        seinco3: new Audio('sound/seinco3.mp3'),
        sehome1: new Audio('sound/sehome1.mp3'),
        sehome2: new Audio('sound/sehome2.mp3'),
        sehome3: new Audio('sound/sehome3.mp3'),
        sehome4: new Audio('sound/sehome4.mp3'),
        sehome5: new Audio('sound/sehome5.mp3'),
        complete: new Audio('sound/complete.mp3')
    };

    // --- 2. 共通関数 ---

    // 【新設】色彩司令官：#hyouji の表示を一括管理
    function updateHyouji(text, type = "default") {
        const colors = {
            default: "",          // CSS規定の赤 (#c62828)
            network: "#3498db",   // 通信中（青）
            ready:   "#c62828",   // 準備・入力中（赤）
            success: "#2ecc71",   // 正解（緑）
            error:   "#ff4757"    // 不正解・エラー（明赤）
        };
        $("#hyouji").html(text).css("color", colors[type] || "");
    }

	function unlockSystem() {
    isLocked = false;
    refreshPanelsExt("normal"); // キャラを通常顔(_1)に戻し、アニメを止める
    console.log("System Unlocked");
}

	
   // 【復旧版】画像・背景色・アニメーションを全て網羅
function refreshPanelsExt(mode = "normal") {
    if (winAnims && winAnims.length > 0) {
        winAnims.forEach(anim => anim.kill());
        winAnims = [];
    }
    $(".celebrate-chara").remove();

    // 2手目の時だけ、事前に「どの3つを変化させるか」を決める
    let specialThree = [];
    if (mode === "win" && selectedSteps === 2) {
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        specialThree = nums.sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    panelState.forEach((num, index) => {
        const targetId = `#p${index + 1}`;
        
        // 1. スタイルのリセット（ただし背景色以外）
        // clearProps: "all" を使うと色も消えるので、特定のプロパティに絞ります
        gsap.set(targetId, { clearProps: "transform,scale,background-image" });

        if (mode === "win") {
            const steps = Math.max(1, selectedSteps);
            let imgFile = null;
            let shouldAnimate = false;

            // --- A. 画像の選定ロジック（法則性の適用） ---
            if (steps === 1) {
                // 1手：変化なし
            } 
            else if (steps === 2) {
                // 2手：ランダムに選ばれた3つだけ変化（動きなし）
                if (specialThree.includes(num)) {
                    // _1 か _2 をランダムで選んで法則の変化を見せる
                    let type = Math.random() < 0.5 ? "_1" : "_2";
                    imgFile = `conum${num}${type}.png`;
                }
            } 
            else if (steps === 3) {
                // 3手：全員変化（動きなし）
                // _1か_2かを固定せず、あえてバラつかせて法則のセット感を見せる
                let type = Math.random() < 0.5 ? "_1" : "_2";
                imgFile = `conum${num}${type}.png`;
            } 
            else {
                // 4手以上：全員変化 ＋ 動きあり
                let type = Math.random() < 0.5 ? "_1" : "_2";
                imgFile = `conum${num}${type}.png`;
                shouldAnimate = true;
            }

            // --- B. 描画の実行 ---
            if (imgFile) {
                const rect = $(targetId)[0].getBoundingClientRect();
                const $chara = $(`<img src="img/${imgFile}" class="celebrate-chara">`).css({
                    position: 'absolute',
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    zIndex: 9999,
                    pointerEvents: 'none'
                });
                $('body').append($chara);

                // 【ここがポイント！】背景画像を none にしても、
                // CSSの背景色はそのまま残るので「薄い色」は消えません。
                $(targetId).css('background-image', 'none');

   if (shouldAnimate) {
    // 4手: power=1, 5手: power=2, 6手: power=3
    const power = steps - 3;
    
    // 【調整】2乗をやめ、ベース数値を固定してマイルドに加算
    // 4手: -20, 5手: -40, 6手: -60 程度の安定した跳躍
    const jumpY = -20 * power; 
    const jumpX = 15 * power;
    
    // 回転も「激しすぎない」程度に
    const rotDeg = 8 * power;

    const startDir = (index % 2 === 0) ? 1 : -1;
    
    // 【調整】早すぎないように duration の下限を設定
    // 4手: 1.2s, 5手: 1.0s, 6手: 0.8s くらいで、しっかり「往復」を見せる
    const dur = 1.4 - (power * 0.2); 

    const anim = gsap.to($chara, {
        keyframes: {
            "0%":   { x: 0, y: 0, rotation: 0 },
            "25%":  { x: jumpX * startDir, y: jumpY, rotation: rotDeg * startDir, ease: "sine.out" },
            "50%":  { x: 0, y: 0, rotation: 0, ease: "sine.in" },
            "75%":  { x: -jumpX * startDir, y: jumpY, rotation: -rotDeg * startDir, ease: "sine.out" },
            "100%": { x: 0, y: 0, rotation: 0, ease: "sine.in" }
        },
        duration: dur,
        delay: index * 0.05,
        repeat: -1,
        ease: "none"
    });

    winAnims.push(anim);
}
            } else {
                refreshSinglePanel(index, false);
            }
        } else {
            // 通常時
            refreshSinglePanel(index, false);
        }
    });
}

  function playSnd(type, force = false) {
        if (!force && isAnimating && type === 'push') return; 
        if (!isSoundOn) return;
        if (sounds[type]) {
            sounds[type].currentTime = 0;
            sounds[type].play().catch(() => {});
        }
    }

    function playStartVoice() {
        const r = Math.floor(Math.random() * 6) + 1;
        let voiceKey = (r <= 3) ? 'sestart1' : (r <= 5 ? 'sestart2' : 'sestart3');
        playSnd(voiceKey, true);
    }

    function playIncompleteVoice() {
        const r = Math.floor(Math.random() * 6) + 1;
        let voiceKey = (r <= 3) ? 'seinco1' : (r <= 5 ? 'seinco2' : 'seinco3');
        playSnd(voiceKey, true);
    }

    function playHomeVoiceByMoves() {
        const r = Math.floor(Math.random() * 6) + 1;
        let voiceKey;
        if (modeMoves <= 2) {
            voiceKey = (r <= 3) ? 'sehome1' : (r <= 5 ? 'sehome2' : 'sehome3');
        } else if (modeMoves <= 4) {
            voiceKey = (r <= 3) ? 'sehome2' : (r <= 5 ? 'sehome3' : 'sehome4');
        } else {
            voiceKey = (r <= 3) ? 'sehome3' : (r <= 5 ? 'sehome4' : 'sehome5');
        }
        playSnd(voiceKey, true);
    }

    // デイリー開始
    async function startChallengeProcess() {
        if (isAnimating) return;
        isComboMode = true; 
        isChallengeMode = true;
        selectedSteps = dailyTargetSteps; 
        modeMoves = selectedSteps;

        $("#input-mode").text("DAILY").addClass("mode-active"); 
        $("#tebo").text(modeMoves);
        
        playSnd('click');

	updateUIState(false); 
        currentAnswer = [];
        updateHyouji("CONNECTING...", "network");

        await setDailyChallenge(selectedSteps);
        
        inputBuffer = [];
        updateHyouji("READY?", "ready");
        
        setTimeout(() => {
            updateHyouji("- ".repeat(selectedSteps).trim(), "ready");
            startTime = performance.now();
        }, 1200);
    }

    async function setDailyChallenge(steps) {
        isAnimating = true; 
        try {
            const url = `${GAS_URL}?action=getDailySeed&steps=${steps}&dayOffset=0&userId=${userId}&appType=POP`;
            const response = await fetch(url);
            const data = await response.json();
            let seed = data.seed; 
            panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            for(let i = 0; i < steps; i++) {
                seed = (seed * 9301 + 49297) % 233280;
                let moveIdx = Math.floor((seed / 233280) * 9);
                logicRotate(moveIdx, false); 
            }
            savedState = [...panelState];
            panelState.forEach((n, i) => posMap[n - 1] = i);
            refreshPanels();
        } catch (e) { 
            updateHyouji("NETWORK ERROR", "error");
        } finally {
            isAnimating = false;
        }
    }

    async function handleRanking(clearTime) {
        await sendLog("postScore", selectedSteps, { time: parseFloat(clearTime), appType: "POP" });
        openGlobalRank(); 
        setTimeout(() => { showGlobalRank(selectedSteps, 0); }, 800);
    }

    async function sendLog(action, mode, extra = {}) {
        try {
            await fetch(GAS_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, mode, userId, appType: extra.appType || "POP", ...extra })
            });
        } catch (e) { console.error("Log Error:", e); }
    }

    function refreshPanels() {
        panelState.forEach((num, index) => { refreshSinglePanel(index, false); });
    }

    function refreshSinglePanel(index, animate = true) {
        const num = panelState[index];
        const targetId = `#p${index + 1}`;
        const posColor = homeColors[index + 1];
        gsap.set(targetId, { clearProps: "all" });
        $(targetId).css({
            'background-image': `url(img/num${num}.png)`,
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            'background-position': 'center'
        });
        if (num === (index + 1)) {
            $(targetId).addClass("at-home").css({ "background-color": posColor, "border-color": posColor });
        } else {
            const r = parseInt(posColor.slice(1, 3), 16);
            const g = parseInt(posColor.slice(3, 5), 16);
            const b = parseInt(posColor.slice(5, 7), 16);
            $(targetId).removeClass("at-home").css({ "background-color": `rgba(${r},${g},${b},0.4)`, "border-color": "#3d4143" });
        }
        if (animate) {
            gsap.fromTo(targetId, { scaleX: 1.3, scaleY: 0.7 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.3)", clearProps: "transform" });
        }
    }

    function updateUIState(active) {
        const buttons = $("#peek-btn, #resebo, #kotae");
        buttons.prop("disabled", !active).css({ "opacity": active ? "1.0" : "0.5", "cursor": active ? "pointer" : "not-allowed" });
    }

    function hantei() {
        const isHome = panelState.every((num, idx) => num === idx + 1);
        if (isHome && !isComboMode) {
            updateHyouji("✨ HOME ✨", "success");
            playSnd('complete', true);
        } else if (!isComboMode) {
            updateHyouji("Let's Try", "default");
        }
    }

    function logicRotate(clickedIdx, clockwise = false) {
        const oldState = [...panelState];
        const routes = {
            0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
            2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
            4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
            6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
            8: [4, 5, 2, 1, 0, 3, 6, 7]
        };
        const targets = routes[clickedIdx];
        for (let i = 0; i < targets.length; i++) {
            const currentPos = targets[i];
            const sourcePos = targets[clockwise ? (i + 1) % 8 : (i + 7) % 8];
            panelState[currentPos] = oldState[sourcePos];
        }
        panelState.forEach((num, idx) => { posMap[num - 1] = idx; });
    }

    function rotatePanels(clickedIdx, clockwise = true, shouldUnlock = true) {
        return new Promise((resolve) => {
            if (isAnimating && shouldUnlock) return resolve();
            isAnimating = true;
            const oldState = [...panelState];
            const panelCoords = Array.from({length: 9}, (_, i) => $(`#p${i+1}`).position());
            logicRotate(clickedIdx, clockwise);

            const routes = {
                0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
                2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
                4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
                6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
                8: [4, 5, 2, 1, 0, 3, 6, 7]
            };
            const targets = routes[clickedIdx];
            let completedCount = 0;

            targets.forEach((currentPos, i) => {
                const sourcePos = targets[clockwise ? (i + 1) % 8 : (i + 7) % 8];
                const numToMove = oldState[sourcePos];
                const startCoord = panelCoords[sourcePos];
                const endCoord = panelCoords[currentPos];

                const $ghost = $('<div class="ghost-num"></div>').css({
                    'background-image': `url(img/num${numToMove}.png)`,
                    'top': startCoord.top, 'left': startCoord.left, 'position': 'absolute', 'z-index': 9999
                });
                $('#content').append($ghost);
                $(`#p${sourcePos + 1}`).css('background-image', 'none');

                gsap.to($ghost, {
                    duration: 0.6 * ANI_SPEED, delay: i * 0.05 * ANI_SPEED, ease: "back.out(1.2)",
                    onUpdate: function() {
                        const p = this.progress();
                        const off = Math.sin(p * Math.PI) * (clockwise ? 60 : -60);
                        gsap.set($ghost, { 
                            x: (endCoord.left - startCoord.left) * p + (endCoord.top !== startCoord.top ? off : 0), 
                            y: (endCoord.top - startCoord.top) * p + (endCoord.left !== startCoord.left ? off : 0), 
                            rotation: (clockwise ? 360 : -360) * p 
                        });
                    },
                    onComplete: () => {
                        $ghost.remove();
                        refreshSinglePanel(currentPos, false);
                        completedCount++;
                        if (completedCount === targets.length) {
                            refreshPanels();
                            if (shouldUnlock) isAnimating = false;
                            hantei();
                            resolve();
                        }
                    }
                });
            });
        });
    }
// モーダル表示関数
function openHowToModal() {
    if ($("#how-to-modal").length === 0) {
        $("body").append(`
            <div id="how-to-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content">
                    <div class="tab-container" style="margin-bottom: 15px;">
                        <button class="tab-btn active" onclick="switchHowToLang('en')">English</button>
                        <button class="tab-btn" onclick="switchHowToLang('ja')">日本語</button>
                    </div>
                    
                    <div id="how-to-body" style="min-height: 200px; text-align: left; font-family: sans-serif;">
                        </div>

                    <button class="bot" onclick="$('#how-to-modal').fadeOut(200)" 
                            style="width:100%; background:#90a4ae; margin-top:20px; box-shadow: 0 5px 0 #546e7a;">
                        CLOSE
                    </button>
                </div>
            </div>
        `);
    }
    // 開くたびに初期言語（または現在の設定）を表示
    switchHowToLang('en'); 
    $("#how-to-modal").fadeIn(200);
}

const howToTexts = {
    en: {
        title: "HOW TO PLAY",
        content: `
            <p>First, make sure the button on the top-left is set to <span style="color:#f1c40f; font-weight:bold;">"SINGLE"</span>, then tap any number above!</p>
            <p>The rule is super easy: <span style="color:#e74c3c; font-weight:bold;">"The number you tap stays still. All the others hop one spot clockwise!"</span></p>

            <p style="margin-top:10px;">Pick a difficulty from 0 to 6. Pick <span style="color:#e67e22; font-weight:bold;">"0"</span> and hit <span style="color:#2ecc71; font-weight:bold;">"SET"</span>. We’ll show you our <span style="color:#3498db; font-weight:bold;">"HOME"</span>!</p>
            
            <p style="margin-top:10px;">Try <span style="color:#e67e22; font-weight:bold;">"1"</span> and hit <span style="color:#2ecc71; font-weight:bold;">"SET"</span>. You are just one tap away! Can you guess which number to tap? Hint: <span style="color:#e74c3c; font-weight:bold;">"Just tap the one number you want to keep in its place!"</span></p>

            <p style="margin-top:10px;"><span style="color:#9b59b6; font-weight:bold;">"PEEK"</span> shows the first move, and <span style="color:#c0392b; font-weight:bold;">"FORBIDDEN FRUIT"</span>... well, it’s a secret!</p>
            
            <p style="margin-top:10px;">Ready? Try the <span style="color:#e74c3c; font-weight:bold;">"Daily Challenge"</span>! Hit <span style="color:#3498db; font-weight:bold;">"START"</span> and check the <span style="color:#f1c40f; font-weight:bold;">"RANK"</span>. Can you make it into the <span style="color:#e74c3c; font-weight:bold;">TOP 5</span>?</p>
        `
    },
    ja: {
        title: "遊び方",
        content: `
            <p>まずは左上のボタンが <span style="color:#4fc3f7; font-weight:bold;">[SINGLE]</span> の時に、上の数字たちをどれか一回押してみて！</p>
	    <p>数字たちが元気に動くのがわかるよね</p>		
            <p>動くルールはとっても簡単：<span style="color:#e74c3c; font-weight:bold;">押した数字はそのままで、それ以外の数字がぜんぶ、時計回りに動いてくれる</span>んだ</p>

            <p style="margin-top:10px;">
	<p>下の赤いボタンで、難しさを 0 から 6 まで選べるよ</p>
	<p><span style="color:#ef5350; font-weight:bold;">[0]</span>を選んでから <span style="color:#ffd54f; font-weight:bold;">[SET]</span> を押すと、僕たちの <span style="color:#8bc34a; font-weight:bold;">[HOME]</span> を教えてあげるね</p>
            
            <p style="margin-top:10px;">
	<p>次は <span style="color:#ef5350; font-weight:bold;">[1]</span> を選んで <span style="color:#ffd54f; font-weight:bold;">[SET]</span> を押してみて!</p>
	<p>あと1回だれかを押せばゴールだよ</p>
	<p>ヒントはね、<span style="color:#8bc34a; font-weight:bold;">動かしたくない数字を、直接ポチッとする</span>ことだよ！</p>

	<p style="margin-top:10px;">
	<p>わかるようになったら<span style="color:#ef5350; font-weight:bold;">[2]</span>を選んで<span style="color:#ffd54f; font-weight:bold;">[SET]</span>を押そう </p>
	<p>数を増やせば、どんどん手強くなるからね</p>

	<p style="margin-top:10px;">
	<p><span style="color:#4fc3f7; font-weight:bold;">[SINGLE]</span>だと一回ずつ動くけど、<span style="color:#4fc3f7; font-weight:bold;">[COMBO]</span>にすると、答えをぜんぶ入れ終わるまで数字たちはじっと待っててくれるよ</p>

            <p style="margin-top:10px;">
	<p><span style="color:#8bc34a; font-weight:bold;">「PEEK」</span> で最初の一手がのぞけるし、 <span style="color:#8bc34a; font-weight:bold;">「FORBIDDEN FRUIT」</span> は自己責任で♪</p>
            
            <p style="margin-top:10px;">
	<p>慣れてきたら <span style="color:#90a4ae; font-weight:bold;">デイリーチャレンジ</span> に挑戦だ！</p>
	<p><span style="color:#90a4ae; font-weight:bold;">[MODE3]</span> なら３回、<span style="color:#90a4ae; font-weight:bold;">[MODE4]</span>なら４回押せば解ける問題、どちらを選ぶ？ </p>
	<p><span style="color:#90a4ae; font-weight:bold;">[START]</span> を押して世界中のみんなと競争しよう！ </p>

	<p><span style="color:#90a4ae; font-weight:bold;">[RANK]</span>でランキングの確認が出来るよ</p>
	<p>TOP 5 には入れたかな？</p>
        `
    }
};

window.switchHowToLang = function(lang) {
    // ボタンの見た目を切り替え
    $("#how-to-modal .tab-btn").removeClass("active");
    if(lang === 'en') $("#how-to-modal .tab-btn:eq(0)").addClass("active");
    else $("#how-to-modal .tab-btn:eq(1)").addClass("active");

    // 中身を書き換え
    const data = howToTexts[lang];
    $("#how-to-body").html(`
        <h2 style="font-family:'Fredoka One'; font-size:18px; color:#546e7a; text-align:center; margin-bottom:10px;">${data.title}</h2>
        <div>${data.content}</div>
    `);
};
    async function executeCombo() {
        if (inputBuffer.length !== selectedSteps || selectedSteps === 0) {
            isAnimating = false; 
            updateHyouji("Input Error", "error");
            return;
        }

        isAnimating = true; 
        const targetNumbers = [...inputBuffer];
        inputBuffer = []; 
        
        playStartVoice(); 
        await new Promise(r => setTimeout(r, 600));

        for (let num of targetNumbers) {
            const currentIdx = posMap[num - 1];
            if (currentIdx !== undefined) {
                playSnd('push', true);
                // 第3引数に false を渡して、個別の rotate 終了時に isAnimating を解除させない
                await rotatePanels(currentIdx, true, false); 
                await new Promise(r => setTimeout(r, 150 * ANI_SPEED)); 
            }
        }

        const isHome = panelState.every((n, i) => n === i + 1);

        if (isHome) {
            // --- 【重要】祝福とロックの開始 ---
            isLocked = true; // パネルの物理操作をロック

            // 1. 色彩司令官：成功の緑
            if (isChallengeMode && startTime > 0) {
                const clearTime = ((performance.now() - startTime) / 1000).toFixed(2);
                updateHyouji(clearTime + "s", "success");
                handleRanking(clearTime);
                isChallengeMode = false; 
                startTime = 0;
            } else {
                updateHyouji("✨ HOME ✨", "success");
            }

            // 2. 画像・アニメーション司令官：ランダム画像選別 ＆ キャラ内部の無限ループ開始
            refreshPanelsExt("win");
            
            // 3. 祝福の声
            playHomeVoiceByMoves();
            
            // ロック中なので、ここで isAnimating を解除してもパネルは触れません
            isAnimating = false; 

        } else {
        // --- 不正解（INCOMPLETE）時の処理 ---
            updateHyouji("INCOMPLETE", "error");
            playIncompleteVoice();
            
            // 1. 失敗の余韻を待つ前に、まずは「独立キャラ」を即座に消す
            $(".celebrate-chara").remove();
            if (winAnims) {
                winAnims.forEach(anim => anim.kill());
                winAnims = [];
            }

            // 2. 失敗の余韻
            await new Promise(r => setTimeout(r, 1500));

            // 3. データの復元
            panelState = [...savedState];
            panelState.forEach((n, i) => posMap[n - 1] = i);
            
            // 4. パネルの背景設定を一旦リセット（念のための掃除）
            $(".panel").css('background-image', ''); 

            // 5. 通常モード("normal")で描き直し
            // ここで imgFile が "numX.png" として評価されるようになります
            refreshPanelsExt("normal"); 
            
            updateHyouji("- ".repeat(selectedSteps).trim(), "ready");
            isAnimating = false;
	}
    }

    function resetToInitial() {
        panelState = [...savedState];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        refreshPanels();
    }

    // --- ランキング関連 ---
    function openGlobalRank() {
        const targetSteps = (isChallengeMode && selectedSteps > 0) ? selectedSteps : dailyTargetSteps;
        if ($("#rank-modal").length === 0) {
            $("body").append(`
                <div id="rank-modal" class="modal-overlay" style="display:none;">
                    <div class="modal-content">
                        <div class="tab-container" style="display:flex; justify-content:space-around; margin-bottom:15px;">
                            <button class="tab-btn bot" onclick="changeRankDay(0)" style="font-size:10px; flex:1; margin:2px;">TODAY</button>
                            <button class="tab-btn bot" onclick="changeRankDay(1)" style="font-size:10px; flex:1; margin:2px;">-1</button>
                            <button class="tab-btn bot" onclick="changeRankDay(2)" style="font-size:10px; flex:1; margin:2px;">-2</button>
                        </div>
                        <h2 id="modal-title" style="font-family:'Fredoka One'; font-size:18px; color:#333;">RANKING</h2>
                        <div id="rank-list" style="margin:10px 0; min-height:100px;"></div>
                        <div id="rank-average" style="font-size:12px; color:#666; margin-bottom:10px; font-family:'Roboto Mono';"></div>
                        <button class="bot rank-btn" onclick="$('#rank-modal').fadeOut(200)" style="width:100%; background:#90a4ae;">CLOSE</button>
                    </div>
                </div>
            `);
        }
        $("#rank-modal").fadeIn(200);
        changeRankDay(0, targetSteps);
    }

    window.changeRankDay = function(offset, forcedSteps = null) {
        currentDayOffset = offset;
        let steps = forcedSteps || ((isChallengeMode && selectedSteps > 0) ? selectedSteps : dailyTargetSteps);
        $(".tab-btn").removeClass("active");
        $(`.tab-btn:eq(${offset})`).addClass("active");
        showGlobalRank(steps, offset);
    };

    async function showGlobalRank(steps, dayOffset = 0) {
        $("#rank-list").html("<div style='padding:20px; color:#3498db; font-family:\"Roboto Mono\"; text-align:center;'>CONNECTING...</div>");
        for (let i = 0; i < 3; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = (i === 0) ? "TODAY" : `${d.getMonth() + 1}/${d.getDate()}`;
            $(`.tab-btn:eq(${i})`).text(label);
        }
        try {
            const url = `${GAS_URL}?action=getRanking&mode=${steps}&dayOffset=${dayOffset}&userId=${userId}&appType=POP`;
            const response = await fetch(url);
            const data = await response.json();
            let listHtml = "";
            if (!data.top5 || data.top5.length === 0) {
                listHtml = `<div style='padding:30px; color:#95a5a6; text-align:center; font-family:\"Roboto Mono\";'>NO DATA<br><small>(${data.date || '----'})</small></div>`;
                $("#rank-average").html("AVG: --s / PLAYS: 0");
            } else {
                data.top5.forEach((score, i) => {
                    const colors = ["#f1c40f", "#bdc3c7", "#e67e22"];
                    const rankColor = colors[i] || "#333";
                    listHtml += `
                    <div class="rank-item" style="display:flex; justify-content:space-between; padding:12px 10px; border-bottom:1px dotted #ccc; font-family:'Roboto Mono';">
                        <span style="color:${rankColor}; font-weight:bold;">${(i===0)?'1st':(i===1)?'2nd':(i===2)?'3rd':(i+1)+'th'}</span>
                        <span style="color:#333; font-weight:500;">${parseFloat(score).toFixed(2)}s</span>
                    </div>`;
                });
                $("#rank-average").html(`AVG: <span style="color:#2ecc71;">${data.average}s</span> / PLAYS: <span style="color:#3498db;">${data.totalPlays}</span>`);
            }
            $("#rank-list").hide().html(listHtml).fadeIn(300);
            $("#modal-title").text(`MODE ${steps} RANK`);
        } catch (e) {
            $("#rank-list").html("<div style='padding:20px; color:#e74c3c; font-family:\"Roboto Mono\"; text-align:center;'>CONNECTION ERROR</div>"); 
        }
    } 

    // --- イベント登録 ---

$('#how-to-btn').click(function() {
    playSnd('click');
    openHowToModal();
});

    $('.bot').click(function() {
        if (isAnimating) return;
        playSnd('click');
        const id = $(this).attr("id");

        if (id === "mode-select") {
            dailyTargetSteps = (dailyTargetSteps === 3) ? 4 : 3; 
            $(this).text("MODE " + dailyTargetSteps);
            panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            panelState.forEach((n, i) => posMap[n - 1] = i);
            currentAnswer = [];
            updateUIState(false);
            updateHyouji("READY?", "default");
            refreshPanels();
        } 
        else if (id === "challenge-start") { 
	if (isAnimating) return;
    if (isLocked) unlockSystem(); // ロック解除
	startChallengeProcess(); 
	}
        else if (id === "rank") { openGlobalRank(); }
    });

    $('.panel').on('click', function() {
        // 1. ガード：アニメーション中、またはクリア後のロック中は一切の入力を受け付けない
        if (isAnimating || isLocked) return; 

        const idx = $(".panel").index(this);

        if (isComboMode && selectedSteps > 0) {
            // --- COMBO モード時の入力処理 ---
            playSnd('click');

            if (inputBuffer.length < selectedSteps) {
                // タップされた位置にあるパネルの「数字」をバッファに記録
                inputBuffer.push(panelState[idx]);

                // 表示の更新（例： "1 3 - -"）
                let disp = inputBuffer.join(" ") + " -".repeat(selectedSteps - inputBuffer.length);
                updateHyouji(disp.trim(), "ready");

                // 指定手数に達したらコンボ実行
                if (inputBuffer.length === selectedSteps) {
                    setTimeout(executeCombo, 180);
                }
            }
        } else {
            // --- SINGLE モード時の通常回転 ---
            playSnd('push');
            rotatePanels(idx);
            // ※ rotatePanels 内で refreshPanelsExt("normal") が呼ばれる想定です
        }
    });

    $("#input-mode").on("click", function() {
        if (isAnimating) return;
	if (isLocked) unlockSystem(); // ロック解除
        playSnd('click');
        isComboMode = !isComboMode;
        $(this).text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        currentAnswer = [];
        updateUIState(false);
        inputBuffer = [];
        updateHyouji(isComboMode ? (selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "SET MOVES!") : "HOME", "default");
        refreshPanels();
    });

    $("#tebo").on("click", function() {
        if (isAnimating) return;
	if (isLocked) unlockSystem(); // ロック解除

	if (isChallengeMode) {
        isChallengeMode = false;
        startTime = 0;
        $("#input-mode").text(isComboMode ? "COMBO" : "SINGLE").removeClass("mode-active");
    }
        playSnd('click');
        modeMoves = (modeMoves + 1) % 7;
        $(this).text(modeMoves);
        selectedSteps = modeMoves; 
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        currentAnswer = [];
        updateUIState(false);
        inputBuffer = [];
        updateHyouji(isComboMode && selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "HOME", "default");
        refreshPanels();
    });

    $("#sebo").on("click", function() {
        if (isAnimating) return;
	if (isLocked) unlockSystem(); // ロック解除

	if (isChallengeMode) {
        isChallengeMode = false;
        startTime = 0;
        $("#input-mode").text(isComboMode ? "COMBO" : "SINGLE").removeClass("mode-active");
    }
        playSnd('click');
        selectedSteps = modeMoves; 
        inputBuffer = [];
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);

        if (modeMoves > 0) {
            let hist = [];
            for (let i = 0; i < modeMoves; i++) {
                const r = Math.floor(Math.random() * 9);
                hist.push(panelState[r]);
                logicRotate(r, false);
            }
            currentAnswer = hist.reverse();
            updateUIState(true);
            updateHyouji(isComboMode ? "- ".repeat(selectedSteps).trim() : "Let's Try", isComboMode ? "ready" : "default");
        } else {
            updateHyouji("HOME", "default");
            updateUIState(false);
            currentAnswer = [];
        }
        savedState = [...panelState];
        savedAnswer = [...currentAnswer];
        savedSelectedSteps = selectedSteps;
        savedIsComboMode = isComboMode;
        refreshPanels();
    });

    $("#resebo").on("click", function() {
        if (isAnimating || isChallengeMode) return;
	if (isLocked) unlockSystem(); // ロック解除
        playSnd('click');
        if (savedState && savedState.length > 0) {
            panelState = [...savedState];
            currentAnswer = [...savedAnswer];
            selectedSteps = savedSelectedSteps;
            isComboMode = savedIsComboMode;
            panelState.forEach((n, i) => posMap[n - 1] = i);
            inputBuffer = [];
            updateHyouji(isComboMode ? "- ".repeat(selectedSteps).trim() : "Let's Try", isComboMode ? "ready" : "default");
            $("#input-mode").text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);
            $("#tebo").text(selectedSteps);
            refreshPanels();
        }
    });

    $(".sys-sound").on("click", function() {
        isSoundOn = !isSoundOn;
        $(this).css("opacity", isSoundOn ? "1.0" : "0.5");
        if(isSoundOn) playSnd('click');
    });

    $("#peek-btn").on("click", function() {
        if (currentAnswer.length === 0 || isAnimating) return;
        $(this).text(`FIRST: ${currentAnswer[0]}`);
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => { $(this).text("PEEK"); }, 3000);
    });

    $("#kotae").on("click", function() {
        if (currentAnswer.length === 0 || isAnimating) return;
        $(this).text(currentAnswer.join(" - "));
        setTimeout(() => { $(this).text("Forbidden fruit"); }, 3000);
    });

    refreshPanels();
});