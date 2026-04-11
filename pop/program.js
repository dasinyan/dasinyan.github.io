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

let dailyTargetSteps = 3; // デイリー用のデフォルト（3 or 4）

  
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

    // --- 1. デイリー用のルールを強制適用 ---
    isComboMode = true; // デイリーは必ずコンボ
    isChallengeMode = true;
    
    // 選ばれている階級（3 or 4）を実行用の手数に同期
    selectedSteps = dailyTargetSteps; 
    modeMoves = selectedSteps;

    // UIの表示を同期
    $("#input-mode").text("DAILY").addClass("mode-active"); 
    $("#tebo").text(modeMoves);
    
    playSnd('click');
    $("#hyouji").text("CONNECTING...").css("color", "#3498db");

    // --- 2. 問題の取得とセット ---
    // ここで selectedSteps (3 or 4) を渡す
    await setDailyChallenge(selectedSteps);
    
    inputBuffer = [];
    $("#hyouji").text("READY?").css("color", "#f1c40f");
    
    setTimeout(() => {
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

    // handleRanking を以下に差し替え
async function handleRanking(clearTime) {
    // 1. スコアを送信
    await sendLog("postScore", selectedSteps, { time: parseFloat(clearTime), appType: "POP" });
    
    // 2. モーダルを開く（未作成なら作成し、TODAYを表示する）
    openGlobalRank(); 
    
    // 3. 送信完了を見計らって、今日のランキングを再ロードして最新化
    setTimeout(() => { 
        showGlobalRank(selectedSteps, 0); 
    }, 800);
}
    async function sendLog(action, mode, extra = {}) {
    try {
        // スコア送信。POSTで appType を直下に配置
        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors", // GASへのPOSTはこれが必要な場合が多いです
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action, 
                mode, 
                userId, 
                appType: extra.appType || "POP",
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
            $("#hyouji").text("✨ HOME ✨").css("color", "");
            playSnd('complete', true);
        } else if (!isComboMode) {
            $("#hyouji").text("Let's Try").css("color", "");
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

// --- ランキング関連関数 ---

function openGlobalRank() {
    // 1. 表示すべき手数を決定（チャレンジ中ならその手数を、そうでなければ選択中のデイリー階級を使用）
    const targetSteps = (isChallengeMode && selectedSteps > 0) ? selectedSteps : dailyTargetSteps;

    // 2. モーダルがまだ無ければ作成
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

    // 3. モーダルを表示
    $("#rank-modal").fadeIn(200);
    
    // 4. 今日のランキングを表示
    changeRankDay(0, targetSteps);
}

// タブクリック時などに呼び出される関数（windowスコープ）
window.changeRankDay = function(offset, forcedSteps = null) {
    currentDayOffset = offset;
    
    // 表示手数の決定ロジック
    let steps = forcedSteps;
    if (!steps) {
        steps = (isChallengeMode && selectedSteps > 0) ? selectedSteps : dailyTargetSteps;
    }
    
    // タブの視覚的切り替え
    $(".tab-btn").removeClass("active");
    $(`.tab-btn:eq(${offset})`).addClass("active");
    
    // データ取得と描画の実行
    showGlobalRank(steps, offset);
};

async function showGlobalRank(steps, dayOffset = 0) {
    // 通信開始の表示
    $("#rank-list").html("<div style='padding:20px; color:#3498db; font-family:\"Roboto Mono\"; text-align:center;'>CONNECTING...</div>");

    // 1. タブのラベル（日付）を動的に更新
    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = (i === 0) ? "TODAY" : `${d.getMonth() + 1}/${d.getDate()}`;
        $(`.tab-btn:eq(${i})`).text(label);
    }

    try {
        // 2. GASへのリクエスト構築（appType=POPを付与）
        const url = `${GAS_URL}?action=getRanking&mode=${steps}&dayOffset=${dayOffset}&userId=${userId}&appType=POP`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        let listHtml = "";
        
        // 3. データの判定とリスト構築
        if (!data.top5 || data.top5.length === 0) {
            listHtml = `<div style='padding:30px; color:#95a5a6; text-align:center; font-family:\"Roboto Mono\";'>NO DATA<br><small>(${data.date || '----'})</small></div>`;
            $("#rank-average").html("AVG: --s / PLAYS: 0");
        } else {
            data.top5.forEach((score, i) => {
                const colors = ["#f1c40f", "#bdc3c7", "#e67e22"]; // 金・銀・銅
                const rankColor = colors[i] || "#333";
                const rankText = (i === 0) ? "1st" : (i === 1) ? "2nd" : (i === 2) ? "3rd" : `${i + 1}th`;
                
                listHtml += `
                <div class="rank-item" style="display:flex; justify-content:space-between; padding:12px 10px; border-bottom:1px dotted #ccc; font-family:'Roboto Mono';">
                    <span style="color:${rankColor}; font-weight:bold;">${rankText}</span>
                    <span style="color:#333; font-weight:500;">${parseFloat(score).toFixed(2)}s</span>
                </div>`;
            });
            
            $("#rank-average").html(`AVG: <span style="color:#2ecc71;">${data.average}s</span> / PLAYS: <span style="color:#3498db;">${data.totalPlays}</span>`);
        }
        
        // 4. UI反映
        $("#rank-list").hide().html(listHtml).fadeIn(300);
        $("#modal-title").text(`MODE ${steps} RANK`);
        
    } catch (e) {
        console.error("Ranking Fetch Error:", e);
        $("#rank-list").html("<div style='padding:20px; color:#e74c3c; font-family:\"Roboto Mono\"; text-align:center;'>CONNECTION ERROR</div>"); 
    }
} 

    // --- 4. イベント登録 ---

$('.bot').click(function() {
    if (isAnimating) return;
    playSnd('click');
    const id = $(this).attr("id");

    // 【修正】デイリーのモード（階級）選択
    if (id === "mode-select") {
        // dailyTargetSteps という変数を新設して管理する場合
        dailyTargetSteps = (dailyTargetSteps === 3) ? 4 : 3; 
        $(this).text("MODE " + dailyTargetSteps);

        // 探偵の助言通り、混乱を防ぐため盤面をHOMEへ
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        currentAnswer = [];
        updateUIState(false);
        $("#hyouji").text("READY?").css("color", ""); // あるいは "HOME"
        refreshPanels();
    } 
    // ...以下、challenge-start や rank の処理...
    else if (id === "challenge-start") {
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

    // モーダル切替
    isComboMode = !isComboMode;
    $(this).text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);

    // --- 【追加】盤面をHOMEに強制リセット ---
    panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    panelState.forEach((n, i) => posMap[n - 1] = i);
    currentAnswer = []; // 正解データも破棄
    updateUIState(false); // PEEK/RESEBOなどのボタンを無効化
    inputBuffer = [];

    // 表示の更新
    if (isComboMode) {
        $("#hyouji").text(selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "SET MOVES!").css("color", "");
    } else {
        $("#hyouji").text("HOME").css("color", "");
    }
    
    refreshPanels();
});

    $("#tebo").on("click", function() {
    if (isAnimating) return;
    playSnd('click');

    modeMoves = (modeMoves + 1) % 7;
    $(this).text(modeMoves);
    selectedSteps = modeMoves; 

    // --- 【追加】手数を変えたら盤面をHOMEに戻す ---
    panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    panelState.forEach((n, i) => posMap[n - 1] = i);
    currentAnswer = [];
    updateUIState(false);
    inputBuffer = [];

    if (isComboMode) {
        $("#hyouji").text(selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "HOME").css("color", "");
    } else {
        $("#hyouji").text("HOME").css("color", "");
    }

    refreshPanels();
});

   $("#sebo").on("click", function() {
    if (isAnimating) return;
    playSnd('click');

    // --- 1. ルールの確定 ---
    // その時の「手数ボタン」の値を「コンボ手数」として同期
    selectedSteps = modeMoves; 
    inputBuffer = []; // 前回の入力の残骸を掃除

    // --- 2. 盤面リセット ---
    panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    panelState.forEach((n, i) => posMap[n - 1] = i);

    // --- 3. 問題生成（0手でなければシャッフル） ---
    if (modeMoves > 0) {
        let hist = [];
        for (let i = 0; i < modeMoves; i++) {
            const r = Math.floor(Math.random() * 9);
            hist.push(panelState[r]);
            logicRotate(r, false); // 逆回転で混ぜる
        }
        currentAnswer = hist.reverse(); // 正解手順を作成
        updateUIState(true);

        // --- 4. 表示の出し分け（ここが重要！） ---
        if (isComboMode) {
            // COMBOモードなら「- - -」を表示。
            // selectedStepsが確定しているので、確実に正しい数のハイフンが出る
            $("#hyouji").text("- ".repeat(selectedSteps).trim()).css("color", "");
        } else {
            // SINGLEなら一律これ
            $("#hyouji").text("Let's Try").css("color", "");
        }
    } else {
        // 0手（HOME）の場合
        $("#hyouji").text("HOME").css("color", "");
        updateUIState(false);
        currentAnswer = [];
    }

    // --- 5. バックアップ ---
    // 【重要】リセット用の証拠品をすべて保存
    savedState = [...panelState];      // 盤面の並び
    savedAnswer = [...currentAnswer];  // 正解の手順（KOTAE）
    savedSelectedSteps = selectedSteps; // その時の手数
    savedIsComboMode = isComboMode;    // その時のモード

    refreshPanels();
});

    $("#resebo").on("click", function() {
    if (isAnimating) return;
    
    // デイリー中はガード（現状維持）
    if (isChallengeMode) return;

    playSnd('click');

    if (savedState && savedState.length > 0) {
        // --- すべてを保存時の状態へ差し替え ---
        panelState = [...savedState];
        currentAnswer = [...savedAnswer]; // KOTAEも復活
        selectedSteps = savedSelectedSteps;
        isComboMode = savedIsComboMode;

        // 盤面のインデックスを再計算
        panelState.forEach((n, i) => posMap[n - 1] = i);
        
        inputBuffer = []; // 打ち込み中の残骸を掃除

        // --- UI表示の同期 ---
        if (isComboMode) {
            $("#hyouji").text("- ".repeat(selectedSteps).trim()).css("color", "");
            $("#input-mode").text("COMBO").addClass("mode-active");
        } else {
            $("#hyouji").text("Let's Try").css("color", "");
            $("#input-mode").text("SINGLE").removeClass("mode-active");
        }
        $("#tebo").text(selectedSteps); // 手数表示も戻す
        
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

    // 初期化
    refreshPanels();
});