$(function() {

    // --- 1. 状態管理 ---
    const GAS_URL = "https://script.google.com/macros/s/AKfycbxYSRnkE_7AM4Q1MeSvOmP4PlyaOG2wc16Zhxu0R6wEjOAak37fHZv0Njr7n64qK4_3/exec";

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
    let savedIsComboMode = false;
    let savedSelectedSteps = 0;
    let savedModeMoves = 0;
    
    let isSoundOn = true;
    let isAnimating = false;
    let currentAnswer = []; 
    let peekTimer = null;   

    let modeMoves = 0;       
    let isComboMode = false; 
    let inputBuffer = [];    
    let selectedSteps = 0; 

  
let currentDayOffset = 0; // 状態管理用

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

    // チャレンジ開始プロセスの定義
async function startChallengeProcess() {
    if (isAnimating) return;

    // --- 【修正ポイント】強制的にCOMBOモードに切り替える ---
    isComboMode = true;
    $("#input-mode").text("COMBO").addClass("mode-active");
    
    // 現在のMODE(3 or 4)を確定させ、手数を同期
    if (selectedSteps === 0) selectedSteps = 3; 
    modeMoves = selectedSteps;
    $("#tebo").text(modeMoves);

    isChallengeMode = true;
    playSnd('click');
    
    $("#hyouji").text("CONNECTING...").css("color", "#3498db");
    
    // デイリー問題をセット（中身を混ぜる）
    await setDailyChallenge(selectedSteps);
    
    // 確実にバッファを空にする
    inputBuffer = [];
    
    $("#hyouji").text("READY?").css("color", "#f1c40f");
    
    setTimeout(() => {
        // コンボ入力待ちの表示（例："- - -"）にする
        $("#hyouji").text("- ".repeat(selectedSteps).trim()).css("color", "");
        startTime = performance.now();
    }, 1200);
}

    async function setDailyChallenge(steps) {
    // set0(false); // POP版にはないので削除
    isAnimating = true; // 通信中も操作できないようにロック
    try {
        const url = `${GAS_URL}?action=getDailySeed&steps=${steps}&dayOffset=0&userId=${userId}&appType=POP`;
        const response = await fetch(url);
        const data = await response.json();
        let seed = data.seed; 
        
        // 盤面を初期状態（HOME）に戻してから混ぜる
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // シード値に基づいてスタンダード版と同じ手順でシャッフル
        for(let i = 0; i < steps; i++) {
            seed = (seed * 9301 + 49297) % 233280;
            let moveIdx = Math.floor((seed / 233280) * 9); // 0〜8のインデックス
            // スタンダード版の挙動（逆回転7回）を再現
            logicRotate(moveIdx, false); 
        }

        // シャッフル後の状態を保存（リセット用）
        savedState = [...panelState];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        refreshPanels();
        
    } catch (e) { 
        console.error("Seed Fetch Error:", e);
        $("#hyouji").text("NETWORK ERROR");
    } finally {
        isAnimating = false;
    }
}

    async function handleRanking(clearTime) {
    // extra引数に appType: "POP" を含めて送信
    await sendLog("postScore", selectedSteps, { time: parseFloat(clearTime), appType: "POP" });
    // 投稿完了後にランキング画面を表示（少し待機してから）
    setTimeout(() => { openGlobalRank(); }, 600);
}

    async function sendLog(action, mode, extra = {}) {
    try {
        await fetch(GAS_URL, {
            method: "POST", 
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            // ここで appType を extra から取り出して「直下」に置く
            body: JSON.stringify({ 
                action, 
                mode, 
                userId, 
                appType: extra.appType || "POP", // 直下に配置
                ...extra 
            })
        });
    } catch (e) { console.error("Log Error:", e); }
}

    function getPaleColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.4)`;
    }

    function refreshPanels() {
        panelState.forEach((num, index) => { refreshSinglePanel(index, false); });
    }

    function refreshSinglePanel(index, animate = true) {
        const num = panelState[index];
        const targetId = `#p${index + 1}`;
        const posColor = homeColors[index + 1];
        gsap.set(targetId, { clearProps: "transform,scale" });
        $(targetId).css({
            'background-image': `url(img/num${num}.png)`,
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            'background-position': 'center'
        });
        if (num === (index + 1)) {
            $(targetId).addClass("at-home").css({ "background-color": posColor, "border-color": posColor });
        } else {
            $(targetId).removeClass("at-home").css({ "background-color": getPaleColor(posColor), "border-color": "#3d4143" });
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
            $("#hyouji").text("✨ HOME ✨");
            playSnd('complete', true);
        } else if (!isComboMode) {
            $("#hyouji").text("Let's Try");
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

        // --- 1. アニメーション開始前の状態を保存 ---
        const oldState = [...panelState];
        const panelCoords = Array.from({length: 9}, (_, i) => $(`#p${i+1}`).position());

        // --- 2. 内部データは「ここだけで」1回更新する ---
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
            const numToMove = oldState[sourcePos]; // 更新前のデータを使用
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
                        refreshPanels(); // 最後に全体を整える
                        if (shouldUnlock) isAnimating = false;
                        hantei();
                        resolve(); // アニメーション完了を通知
                    }
                }
            });
        });
    });
}

    async function executeCombo() {
    // 1. 入力チェック
    if (inputBuffer.length !== selectedSteps || selectedSteps === 0) {
        isAnimating = false; 
        $("#hyouji").text("Input Error"); 
        return;
    }

    isAnimating = true; // 処理開始。ロックをかけるasync function executeCombo() {
    // 1. 入力チェック
    if (inputBuffer.length !== selectedSteps || selectedSteps === 0) {
        isAnimating = false; 
        $("#hyouji").text("Input Error"); 
        return;
    }

    isAnimating = true; // 処理開始。ロックをかける
    const targetNumbers = [...inputBuffer];
    inputBuffer = []; // バッファをクリア
    
    // チャレンジ中ならボイスは開始時に鳴っているので、ここではSEのみ
    if (!isChallengeMode) playStartVoice(); 
    await new Promise(r => setTimeout(r, 600)); // 開始前のタメ

    // 2. 連続回転処理
    for (let num of targetNumbers) {
        const currentIdx = posMap[num - 1];
        if (currentIdx !== undefined) {
            playSnd('push', true);
            await rotatePanels(currentIdx, true, false); 
            await new Promise(r => setTimeout(r, 150 * ANI_SPEED)); 
        }
    }

    // 3. 全てのアニメーション完了後の判定
    const isHome = panelState.every((n, i) => n === i + 1);

    if (isHome) {
        // --- 【正解時】盤面・タイムを表示したまま停止 ---
        if (isChallengeMode && startTime > 0) {
            const clearTime = ((performance.now() - startTime) / 1000).toFixed(2);
            $("#hyouji").html(clearTime + "s").css("color", "#2ecc71");
            handleRanking(clearTime); // ランキング送信
            isChallengeMode = false;  // クリアしたのでフラグを折る
            startTime = 0;
        } else {
            $("#hyouji").text("✨ HOME ✨").css("color", "#2ecc71");
        }
        
        playHomeVoiceByMoves();
        // 自動リセット(resetToInitial)は呼ばない
        
    } else {
        // --- 【不正解時】ボイスを流して、自動的に問題の最初に戻す ---
        $("#hyouji").text("INCOMPLETE").css("color", "#ff4757");
        playIncompleteVoice();
        
        await new Promise(r => setTimeout(r, 1500));
        
        // 盤面をリトライ用に「その問題の開始時」へ戻す
        resetToInitial();
        
        // タイム計測(startTime)はリセットせず、入力待ち表示に戻す
        $("#hyouji").text("- ".repeat(selectedSteps).trim()).css("color", "");
    }

    // 4. 状態の復元
    isAnimating = false; // 全ての処理が終わったのでロック解除
}

    function resetToInitial() {
        panelState = [...savedState];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        refreshPanels();
    }

   function openGlobalRank() {

	if (selectedSteps === 0) {
        selectedSteps = 3;
    }
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
                    
                    <div id="rank-list" style="margin:10px 0;"></div>
                    
                    <div id="rank-average" style="font-size:12px; color:#666; margin-bottom:10px; font-family:'Roboto Mono';"></div>
                    
                    <button class="bot rank-btn" onclick="$('#rank-modal').fadeOut(200)" style="width:100%; background:#90a4ae;">CLOSE</button>
                </div>
            </div>
        `);
    }
    
    // 初期化：今日のランキングを表示
    changeRankDay(0);
}


function changeRankDay(offset) {
    currentDayOffset = offset;
    
    // 全てのタブからactiveを消し、今回押したのだけに付与
    $(".tab-btn").removeClass("active");
    $(`.tab-btn:eq(${offset})`).addClass("active");
    
    showGlobalRank(selectedSteps, offset);
}
async function showGlobalRank(steps, dayOffset = 0) {
    $("#rank-modal").fadeIn(200);
    $("#rank-list").html("<div style='padding:20px; color:#3498db;'>CONNECTING...</div>");

    // 日付ラベルの更新（スタンダード版のロジック）
    for (let i = 0; i < 3; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const label = (i === 0) ? "TODAY" : `${d.getMonth() + 1}/${d.getDate()}`;
        $(`.tab-btn:eq(${i})`).text(label);
    }

    try {
        // 重要：appType=POP を付与してスタンダード版と差別化
        const url = `${GAS_URL}?action=getRanking&mode=${steps}&dayOffset=${dayOffset}&userId=${userId}&appType=POP`;
        const response = await fetch(url);
        const data = await response.json();
        
        let listHtml = "";
        
        if (!data.top5 || data.top5.length === 0) {
            listHtml = `<div style='padding:30px; color:#95a5a6; text-align:center;'>NO DATA<br><small>(${data.date})</small></div>`;
            $("#rank-average").html("AVERAGE: --s");
        } else {
            // 上位リストの構築
            data.top5.forEach((s, i) => {
                const colors = ["#f1c40f", "#bdc3c7", "#e67e22"]; // 金銀銅
                const rankColor = colors[i] || "#333";
                listHtml += `
                <div class="rank-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px dotted #ccc; font-family:'Roboto Mono';">
                    <span style="color:${rankColor}; font-weight:bold;">${i + 1}st</span>
                    <span style="color:#333;">${parseFloat(s).toFixed(2)}s</span>
                </div>`;
            });
            
            // スタンダード版継承：平均タイムとプレイ回数
            $("#rank-average").html(`AVG: <span style="color:#2ecc71;">${data.average}s</span> / PLAYS: <span style="color:#3498db;">${data.totalPlays}</span>`);
        }
        
        $("#rank-list").html(listHtml);
        $("#modal-title").text(`MODE ${steps} RANK`);
        
    } catch (e) { 
        $("#rank-list").html("<div style='padding:20px; color:#e74c3c;'>CONNECTION ERROR</div>"); 
    }
}

    // --- 4. イベント登録 ---

    $('.bot').click(function() {
        if (isAnimating) return;
        playSnd('click');
        const id = $(this).attr("id");
        if (id === "mode-select") {
            selectedSteps = (selectedSteps === 3) ? 4 : 3;
            $(this).text("MODE " + selectedSteps);
            if (isComboMode) $("#hyouji").text("- ".repeat(selectedSteps).trim());
        } else if (id === "challenge-start") {
            startChallengeProcess();
        } else if (id === "rank") {
            openGlobalRank();
        }
    });

    $('.panel').on('click', function() {
        if (isAnimating) return;
        const idx = $(".panel").index(this);
        if (isComboMode && selectedSteps > 0) {
            playSnd('click');
            if (inputBuffer.length < selectedSteps) {
                inputBuffer.push(panelState[idx]);
                let disp = inputBuffer.join(" ") + " -".repeat(selectedSteps - inputBuffer.length);
                $("#hyouji").text(disp.trim());
                if (inputBuffer.length === selectedSteps) setTimeout(executeCombo, 180);
            }
        } else {
            playSnd('push');
            rotatePanels(idx);
        }
    });

    $("#input-mode").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
        isComboMode = !isComboMode;
        $(this).text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);
        $("#hyouji").text(isComboMode ? (selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "SET MOVES!") : "Let's Try");
        inputBuffer = [];
    });

    $("#tebo").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
        modeMoves = (modeMoves + 1) % 7;
        $(this).text(modeMoves);
        if (isComboMode) {
            selectedSteps = modeMoves;
            $("#hyouji").text(selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "HOME");
            inputBuffer = [];
        }
    });

    $("#sebo").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
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
            $("#hyouji").text(isComboMode ? "- ".repeat(selectedSteps).trim() : "Let's Try");
        } else {
            $("#hyouji").text("HOME");
            updateUIState(false);
        }
        savedState = [...panelState];
        savedIsComboMode = isComboMode;
        savedSelectedSteps = selectedSteps;
        savedModeMoves = modeMoves;
        refreshPanels();
    });

    $("#resebo").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
        resetToInitial();
        isComboMode = savedIsComboMode;
        selectedSteps = savedSelectedSteps;
        modeMoves = savedModeMoves;
        $("#tebo").text(modeMoves);
        $("#input-mode").text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);
        $("#hyouji").text(isComboMode ? "- ".repeat(selectedSteps).trim() : "Let's Try");
        inputBuffer = [];
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

    // 初期化
    refreshPanels();
});