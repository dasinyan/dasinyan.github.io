$(function() {
    // --- 1. 状態管理 ---
    let panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9]; 
    let isSoundOn = true;
    let modeMoves = 0;   // 手数
    let isAnimating = false; // アニメーション中フラグ

const ANI_SPEED = 1.0; // 1.0が標準、2.0にすれば2倍ゆっくり（時間が2倍）になる	

    const homeColors = {
        1: "#d41616", 2: "#2a7cd9", 3: "#ffd700",
        4: "#26a261", 5: "#f7931e", 6: "#892faa",
        7: "#ff47b9", 8: "#8cc63f", 9: "#30c9ff"
    };

    // 音源のプリロード
    const sounds = {
        push: new Audio('sound/push.mp3'),
        click: new Audio('sound/click.mp3')
    };

    function playSnd(type) {
        // アニメーション中なら音を鳴らさない（連打ガード）
        if (isAnimating) return;
        if (!isSoundOn) return;
        sounds[type].currentTime = 0;
        sounds[type].play().catch(() => {});
    }

    // HOMEカラーを薄くする補助関数 (40%の濃さ)
    function getPaleColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.4)`;
    }

    // --- 2. 描画関数 (全体更新) ---
    function refreshPanels() {
        panelState.forEach((num, index) => {
            refreshSinglePanel(index, false); // アニメなしで更新
        });
    }

    // --- 2.5 描画関数 (単一パネル更新 + プルプル) ---
    function refreshSinglePanel(index, animate = true) {
        const num = panelState[index];
        const targetId = `#p${index + 1}`;
        const posColor = homeColors[index + 1];

        // 1. 数字画像の描画 (透過背景前提)
        $(targetId).css({
            'background-image': `url(img/num${num}.png)`,
            'background-size': 'contain', // キャラ全体が見えるように
            'background-repeat': 'no-repeat',
            'background-position': 'center'
        });

        // 2. HOME判定と背景色設定
        if (num === (index + 1)) {
            // 正解位置：濃い色、枠なし
            $(targetId).addClass("at-home").css({
                "background-color": posColor,
                "border-color": posColor // 枠線を色に馴染ませる
            });
        } else {
            // 不正解位置：薄い色、枠あり
            $(targetId).removeClass("at-home").css({
                "background-color": getPaleColor(posColor),
                "border-color": "#3d4143" // デフォルトの枠色
            });
        }

        // 3. 到着時の「プルプル」演出（アニメフラグがONの時のみ）
        if (animate) {
            gsap.fromTo(targetId, 
                { scaleX: 1.3, scaleY: 0.7 }, // 横長に潰れる衝撃
                { 
                    scaleX: 1, scaleY: 1, 
                    duration: 0.6, 
                    ease: "elastic.out(1, 0.3)", // 弾力
                    clearProps: "transform" // 終了後に綺麗にする
                }
            );
        }
    }

    // --- 3. 回転ロジック (【大幅修正】数字だけ飛ぶ演出) ---

// --- 3. 回転ロジック (ワープ完全防止版) ---
function rotatePanels(clickedIdx, clockwise = true) {
    if (isAnimating) return;
    isAnimating = true; 

    const oldState = [...panelState];
    const nextState = [...panelState];
    
    const routes = {
        0: [1, 4, 3, 6, 7, 8, 5, 2], 1: [0, 3, 6, 7, 8, 5, 2, 4],
        2: [1, 0, 3, 6, 7, 8, 5, 4], 3: [0, 4, 6, 7, 8, 5, 2, 1],
        4: [0, 3, 6, 7, 8, 5, 2, 1], 5: [2, 1, 0, 3, 6, 7, 8, 4],
        6: [3, 4, 7, 8, 5, 2, 1, 0], 7: [6, 4, 8, 5, 2, 1, 0, 3],
        8: [5, 2, 1, 0, 3, 6, 7, 4]
    };
    const targets = routes[clickedIdx];

    // 座標の先読み（リフロー対策）
    const panelCoords = [];
    for (let i = 1; i <= 9; i++) {
        const $p = $(`#p${i}`);
        panelCoords[i - 1] = {
            top: $p.position().top,
            left: $p.position().left
        };
    }

    // 内部ロジック更新
    for (let i = 0; i < targets.length; i++) {
        const currentPos = targets[i];
        const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
        const sourcePos = targets[sourceIdxInRoute];
        nextState[currentPos] = oldState[sourcePos];
    }

    targets.forEach((currentPos, i) => {
        const targetPosId = `#p${currentPos + 1}`;
        const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
        const sourcePos = targets[sourceIdxInRoute];
        const numToMove = oldState[sourcePos];

        const startCoord = panelCoords[sourcePos];
        const endCoord = panelCoords[currentPos];

        // ゴースト生成
        const $ghost = $('<div class="ghost-num"></div>').css({
            'background-image': `url(img/num${numToMove}.png)`,
            'z-index': 100,
            'top': startCoord.top,
            'left': startCoord.left,
            'position': 'absolute' // CSSで指定済みかもしれませんが念のため
        });
        $('#content').append($ghost);

        // ★【ここが最重要】アニメーション前に座標を「0」に固定
        // これをしないと、append直後の不安定な座標を参照してワープします
        gsap.set($ghost, { x: 0, y: 0, scale: 1, rotation: 0 });

        // 元のパネルを消す（このタイミングでOK）
        $(`#p${sourcePos + 1}`).css('background-image', 'none');
        $(targetPosId).css('background-image', 'none'); 

        const diffX = endCoord.left - startCoord.left;
        const diffY = endCoord.top - startCoord.top;
        const curveSize = clockwise ? 60 : -60;

        // GSAP実行
        gsap.to($ghost, { 
            x: diffX, 
            y: diffY, 
            rotation: clockwise ? 360 : -360,
            duration: 0.6 * ANI_SPEED,
            delay: i * 0.05 * ANI_SPEED,
            ease: "back.out(1.2)", 
            
            onStart: () => {
                // 移動先の枠を一瞬光らせる
                gsap.to(targetPosId, { backgroundColor: "#fff", duration: 0.1 * ANI_SPEED, yoyo: true, repeat: 1 });
            },

            onUpdate: function() {
                const progress = this.progress();
                const sineProg = Math.sin(progress * Math.PI); 
                const offset = sineProg * curveSize;
                const shadowSize = sineProg * 20;

                gsap.set($ghost, { 
                    // x, y の移動に offset を加算して放物線を描く
                    x: diffX * progress + (diffY !== 0 ? offset : 0),
                    y: diffY * progress + (diffX !== 0 ? offset : 0),
                    scale: 1 + (sineProg * 0.2), 
                    filter: `drop-shadow(${shadowSize}px ${shadowSize}px 15px rgba(0,0,0,0.4))`
                });
            },

            onComplete: () => {
                panelState[currentPos] = nextState[currentPos]; 
                refreshSinglePanel(currentPos, true); 
                $ghost.remove();

                if (i === targets.length - 1) {
                    isAnimating = false;
                    refreshPanels(); 
                }
            }
        });
    });
} 
  // --- 4. イベント登録 ---

    // パネルクリック
    $(".panel").on("click", function() {
        const idx = $(".panel").index(this);
        playSnd('push'); // パネルはpush音
        
        // クリックされたパネル自体の「押し込み」演出
        gsap.to(this, { 
            scale: 0.9, duration: 0.05, yoyo: true, repeat: 1, ease: "power2.out" 
        });

        rotatePanels(idx);
    });

    // SOUNDボタン
    $(".sys-sound").on("click", function() {
        isSoundOn = !isSoundOn;
        $(this).css("opacity", isSoundOn ? "1.0" : "0.5");
        if(isSoundOn) playSnd('click');
    });

    // 手数ボタン (0-6ループ)
    $(".moves-counter").on("click", function() {
        playSnd('click');
        modeMoves = (modeMoves + 1) % 7; 
        $(this).text(modeMoves);
    });

    // SETボタン (逆算シャッフル)
    $(".sys-set").on("click", function() {
        if (isAnimating) return; // アニメ中はガード
        playSnd('click');

        // 一旦正解に戻す
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // 指定手数分、ランダムな位置を「反時計回り」に回す
        for(let i = 0; i < modeMoves; i++) {
            const randomIdx = Math.floor(Math.random() * 9);
            // 内部ロジックだけ逆回し（アニメなし）
            logicRotate(randomIdx, false); 
        }

        // 全体を即時描画
        refreshPanels();
        
        // シャッフル演出（少し揺らす）
        gsap.from(".panel", { scale: 0.8, opacity: 0, duration: 0.3, stagger: 0.02, ease: "back.out" });
    });

    // RESETボタン（追加）
    $(".sys-reset").on("click", function() {
        if (isAnimating) return;
        playSnd('click');
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        refreshPanels();
        gsap.from(".panel", { rotation: -10, scale: 0.9, duration: 0.3, stagger: 0.02 });
    });


    // --- 5. アニメーションなしの論理回転 (SETボタン用) ---
    function logicRotate(clickedIdx, clockwise = true) {
        const oldState = [...panelState];
        const nextState = [...panelState];
        const routes = {
            0: [1, 4, 3, 6, 7, 8, 5, 2], 1: [0, 3, 6, 7, 8, 5, 2, 4],
            2: [1, 0, 3, 6, 7, 8, 5, 4], 3: [0, 4, 6, 7, 8, 5, 2, 1],
            4: [0, 3, 6, 7, 8, 5, 2, 1], 5: [2, 1, 0, 3, 6, 7, 8, 4],
            6: [3, 4, 7, 8, 5, 2, 1, 0], 7: [6, 4, 8, 5, 2, 1, 0, 3],
            8: [5, 2, 1, 0, 3, 6, 7, 4]
        };
        const targets = routes[clickedIdx];
        for (let i = 0; i < targets.length; i++) {
            const currentPos = targets[i];
            const sourceIdxInRoute = clockwise ? (i + 1) % 8 : (i + 7) % 8;
            const sourcePos = targets[sourceIdxInRoute];
            nextState[currentPos] = oldState[sourcePos];
        }
        panelState = nextState;
    }

    // 初期化
    $(".moves-counter").text(modeMoves);
    refreshPanels();
});