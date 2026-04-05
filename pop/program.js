$(function() {
    // --- 1. 状態管理 ---
    let panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9]; 
    let posMap = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let savedState = [1, 2, 3, 4, 5, 6, 7, 8, 9]; 
    let isSoundOn = true;
    let isAnimating = false;
    let currentAnswer = []; 
    let peekTimer = null;   

    let modeMoves = 0;       
    let isComboMode = false; 
    let inputBuffer = [];    
    let selectedSteps = 0;   

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
        let voiceKey;
        if (r <= 3) voiceKey = 'sestart1';
        else if (r <= 5) voiceKey = 'sestart2';
        else voiceKey = 'sestart3';
        playSnd(voiceKey, true);
    }

    function playIncompleteVoice() {
        const r = Math.floor(Math.random() * 6) + 1;
        let voiceKey;
        if (r <= 3) voiceKey = 'seinco1';
        else if (r <= 5) voiceKey = 'seinco2';
        else voiceKey = 'seinco3';
        playSnd(voiceKey, true);
    }

	/**
 * 手数(modeMoves)に応じた正解ボイスを 3:2:1 の比率で再生
 */
function playHomeVoiceByMoves() {
    const r = Math.floor(Math.random() * 6) + 1; // 1〜6の乱数
    let voiceKey;

    if (modeMoves <= 2) {
        // 手数 1〜2 (または0): sehome 1(50%), 2(33%), 3(17%)
        if (r <= 3) voiceKey = 'sehome1';
        else if (r <= 5) voiceKey = 'sehome2';
        else voiceKey = 'sehome3';
    } 
    else if (modeMoves <= 4) {
        // 手数 3〜4: sehome 2(50%), 3(33%), 4(17%)
        if (r <= 3) voiceKey = 'sehome2';
        else if (r <= 5) voiceKey = 'sehome3';
        else voiceKey = 'sehome4';
    } 
    else {
        // 手数 5〜6: sehome 3(50%), 4(33%), 5(17%)
        if (r <= 3) voiceKey = 'sehome3';
        else if (r <= 5) voiceKey = 'sehome4';
        else voiceKey = 'sehome5';
    }

    playSnd(voiceKey, true);
}

    function getPaleColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.4)`;
    }

    function refreshPanels() {
        panelState.forEach((num, index) => {
            refreshSinglePanel(index, false);
        });
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
            gsap.fromTo(targetId, 
                { scaleX: 1.3, scaleY: 0.7 },
                { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.3)", clearProps: "transform" }
            );
        }
    }

    function updateUIState(active) {
        const buttons = $("#peek-btn, #resebo, #kotae");
        if (active) {
            buttons.prop("disabled", false).css({ "opacity": "1.0", "cursor": "pointer" });
            $("#kotae").text("Forbidden fruit");
        } else {
            buttons.prop("disabled", true).css({ "opacity": "0.5", "cursor": "not-allowed" });
            $("#kotae").text("Forbidden fruit");
        }
    }

    function hantei() {
    const isHome = panelState.every((num, idx) => num === idx + 1);
    
    if (isHome) {
        // SINGLEモードの時だけ「HOME」と「complete音」
        if (!isComboMode) {
            $("#hyouji").text("✨ HOME ✨");
            playSnd('complete', true);
        }
    } else {
        // SINGLEモードで、まだ解けていない時だけ
        if (!isComboMode) {
            $("#hyouji").text("Let's Try");
        }
        // COMBOモードの時は、executeCombo側でセットした「- - -」を維持するため何もしない
    }
}

    // --- 3. ロジック ---

    function logicRotate(clickedIdx, clockwise = false) {
        const oldState = [...panelState];
        const nextState = [...panelState];
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
            const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
            const sourcePos = targets[sourceIdxInRoute];
            nextState[currentPos] = oldState[sourcePos];
        }
        panelState = [...nextState];
        panelState.forEach((num, idx) => { posMap[num - 1] = idx; });
    }

    function rotatePanels(clickedIdx, clockwise = true, shouldUnlock = true) {
        if (isAnimating && shouldUnlock) return;
        isAnimating = true; 
        const oldState = [...panelState];
        const nextState = [...panelState];
        const routes = {
            0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
            2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
            4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
            6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
            8: [4, 5, 2, 1, 0, 3, 6, 7]
        };
        const targets = routes[clickedIdx];
        const panelCoords = [];
        for (let i = 1; i <= 9; i++) {
            const $p = $(`#p${i}`);
            panelCoords[i - 1] = { top: $p.position().top, left: $p.position().left };
        }
        for (let i = 0; i < targets.length; i++) {
            const currentPos = targets[i];
            const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
            const sourcePos = targets[sourceIdxInRoute];
            const movingNum = oldState[sourcePos];
            nextState[currentPos] = movingNum;
            posMap[movingNum - 1] = currentPos;
        }
        panelState = [...nextState];

        targets.forEach((currentPos, i) => {
            const targetPosId = `#p${currentPos + 1}`;
            const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
            const sourcePos = targets[sourceIdxInRoute];
            const numToMove = oldState[sourcePos];
            const startCoord = panelCoords[sourcePos];
            const endCoord = panelCoords[currentPos];
            const $ghost = $('<div class="ghost-num"></div>').css({
                'background-image': `url(img/num${numToMove}.png)`,
                'z-index': 100, 'top': startCoord.top, 'left': startCoord.left, 'position': 'absolute'
            });
            $('#content').append($ghost);
            $(`#p${sourcePos + 1}`).css('background-image', 'none');
            const diffX = endCoord.left - startCoord.left;
            const diffY = endCoord.top - startCoord.top;
            const curveSize = clockwise ? 60 : -60;
            gsap.to($ghost, { 
                duration: 0.6 * ANI_SPEED, delay: i * 0.05 * ANI_SPEED, ease: "back.out(1.2)",
                onUpdate: function() {
                    const progress = this.progress();
                    const sineProg = Math.sin(progress * Math.PI); 
                    const offset = sineProg * curveSize;
                    gsap.set($ghost, { 
                        x: diffX * progress + (diffY !== 0 ? offset : 0),
                        y: diffY * progress + (diffX !== 0 ? offset : 0),
                        rotation: (clockwise ? 360 : -360) * progress,
                        scale: 1 + (sineProg * 0.2), 
                        filter: `drop-shadow(${sineProg * 10}px ${sineProg * 10}px 10px rgba(0,0,0,0.3))`
                    });
                },
                onComplete: () => {
                    refreshSinglePanel(currentPos, false); 
                    $ghost.remove();
                    if (i === targets.length - 1) {
                        refreshPanels(); 
                        if (shouldUnlock) isAnimating = false;
                        hantei();
                    }
                }
            });
        });
    }

   async function executeCombo() {
    // 1. バリデーション
    if (inputBuffer.length !== selectedSteps || selectedSteps === 0) {
        isAnimating = false;
        $("#hyouji").text("Input Error");
        return;
    }

    // 2. 実行準備
    isAnimating = true; 
    const targetNumbers = [...inputBuffer];
    inputBuffer = []; // バッファを先に空にしておく
    
    // 開始ボイス
    playStartVoice();
    
    // ボイスを聞かせるための「溜め」
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. パネル回転ループ
    for (let num of targetNumbers) {
        const currentIdx = posMap[num - 1];
        if (currentIdx !== undefined && currentIdx >= 0 && currentIdx < 9) {
            playSnd('push', true);
            isAnimating = false; 
            rotatePanels(currentIdx, true, false); // shouldUnlockをfalseにして連鎖
            await new Promise(resolve => setTimeout(resolve, 950 * ANI_SPEED));
            isAnimating = true; // ループ中は入力をガード
        }
    }

    // 4. 結果判定セクション
    const isHome = panelState.every((num, idx) => num === idx + 1);

    if (isHome) {
        // 【正解：PERFECT】
        $("#hyouji").text("✨ HOME ✨");
        playHomeVoiceByMoves(); // 手数に応じた比率で称賛

        await new Promise(resolve => setTimeout(resolve, 2000));

        // 正解後リセット演出
        $("#hyouji").text("RESET..."); 
        resetToInitial(); 
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 入力待ち表示へ復帰
        if (isComboMode && selectedSteps > 0) {
            $("#hyouji").text("- ".repeat(selectedSteps).trim());
        }

    } else {
        // 【不正解：INCOMPLETE】
        $("#hyouji").text("INCOMPLETE");
        playIncompleteVoice(); // ディスりボイス

        await new Promise(resolve => setTimeout(resolve, 1500));

        // 不正解後リセット演出
        $("#hyouji").text("RETRY...");
        resetToInitial(); 
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 入力待ち表示へ復帰
        if (isComboMode && selectedSteps > 0) {
            $("#hyouji").text("- ".repeat(selectedSteps).trim());
        }
    }

    // 5. 終了処理
    isAnimating = false; 
    
    // COMBOモード時は表示を維持したいので、SINGLEの時だけhanteiに任せる
    if (!isComboMode) {
        hantei(); 
    }
}

/**
 * 盤面を問題開始時の状態 (savedState) に戻す共通関数
 */
function resetToInitial() {
    panelState = [...savedState];
    panelState.forEach((num, idx) => {
        posMap[num - 1] = idx;
    });
    refreshPanels();
}

    // --- 4. イベント登録 ---

    $('.panel').on('click', function() {
        if (isAnimating) return;
        const panelIndex = $(".panel").index(this);
        const clickedNum = panelState[panelIndex];
        if (isComboMode && selectedSteps > 0) {
            playSnd('click');
            if (inputBuffer.length < selectedSteps) {
                inputBuffer.push(clickedNum);
                let displayStr = inputBuffer.join(" ");
                for (let i = inputBuffer.length; i < selectedSteps; i++) {
                    displayStr += " -";
                }
                $("#hyouji").text(displayStr.trim());
            }
            if (inputBuffer.length === selectedSteps) {
                setTimeout(() => { executeCombo(); }, 180);
            }
        } else {
            playSnd('push');
            rotatePanels(panelIndex);
        }
    });

    $("#input-mode").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
        isComboMode = !isComboMode;
        if (isComboMode) {
            $(this).text("COMBO").addClass("mode-active");
            selectedSteps = modeMoves;
            $("#hyouji").text(selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "SET MOVES!");
        } else {
            $(this).text("SINGLE").removeClass("mode-active");
            $("#hyouji").text("Let's Try");
        }
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
        inputBuffer = [];
        selectedSteps = modeMoves;
        currentAnswer = [];
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        posMap = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        if (modeMoves === 0) {
            $("#hyouji").text("HOME");
            updateUIState(false);
        } else {
            let shuffleHistory = [];
            for(let i = 0; i < modeMoves; i++) {
                const randomIdx = Math.floor(Math.random() * 9);
                shuffleHistory.push(panelState[randomIdx]);
                logicRotate(randomIdx, false);
            }
            currentAnswer = shuffleHistory.reverse();
            updateUIState(true);
            $("#hyouji").text(isComboMode ? "- ".repeat(selectedSteps).trim() : "Let's Try");
        }
        savedState = [...panelState];
        refreshPanels();
        gsap.fromTo(".panel", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.02, ease: "back.out", overwrite: true });
    });

    $("#resebo").on("click", function() {
        if (isAnimating || savedState.length === 0) return;
        playSnd('click');
        panelState = [...savedState];
        panelState.forEach((num, idx) => { posMap[num - 1] = idx; });
        inputBuffer = [];
        if (isComboMode) $("#hyouji").text("- ".repeat(selectedSteps).trim());
        refreshPanels();
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

    // 初期化実行
    $("#tebo").text(modeMoves);
    refreshPanels();

}); // ← ここで全ての $(function() { ... }) を閉じる