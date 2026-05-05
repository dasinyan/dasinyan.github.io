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
	
// 他のフラグ（isLocked など）の近くに配置します
let isDancing = false; 
let stopDanceRequest = false; // 中止命令を伝達するためのフラグ
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

// ダンス用のグローバル変数
let danceGhosts = [];

// 関数の外（ファイルの上のほう）で宣言だけしておく
let danceAudio = null;

    // --- 2. 共通関数 ---

// startHoneyLemonSequence()の外側に定義
function abortDance() {
    if (!isDancing) return; 
	$('body').removeClass('dancing-bg');
    clearBubbles(); // 泡をお掃除

    console.log("Dance Aborted: 割り込みによる強制終了");

    // 1. 音を即座に消す（あるいは短いフェードアウト）
    if (danceAudio) {
        gsap.to(danceAudio, { 
            volume: 0, 
            duration: 0.3, 
            onComplete: () => {
                danceAudio.pause();
                danceAudio = null;
            }
        });
    }

    // 2. GSAPの進行中のアニメーションをすべて殺す
    gsap.killTweensOf(".frenzy-ghost");

    // 3. 画面上のゴーストを物理的に消去
    clearAllDanceEffects(); 

    // 4. フラグの解除
    isDancing = false;
    isLocked = false;
    stopDanceRequest = true; // startHoneyLemonSequence内のループを止める用
}

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


function clearAllDanceEffects() {
    console.log("Cleaning up the stage...");

    // 1. 数字（ゴースト）の消去
    if (typeof $allGhosts !== 'undefined') {
        $allGhosts.remove(); // 冒頭で取得した変数があれば一気に消去
    }
    $(".frenzy-ghost").remove(); // 念のためクラス名でも一掃
    
    // 2. パズル実体の復元
    $(".panel").css('visibility', 'visible'); 
    
    // 3. アニメーション（GSAP）の強制停止
    gsap.killTweensOf(".frenzy-ghost");
    gsap.killTweensOf(".lemon-bubble");

    // 4. 背景演出の解除（今回追加分）
    $('body').removeClass('dancing-bg');
    clearBubbles(); // 泡の消去関数を呼び出す

    // 5. フラグの初期化
    isDancing = false;
    isLocked = false;
}

// ゴースト（影武者）を生成して配置する関数
function createDanceGhosts() {
    clearAllDanceEffects(); // 二重生成防止
    
    for (let i = 1; i <= 9; i++) {
        const $panel = $(`#p${i}`);
        const rect = $panel[0].getBoundingClientRect();
        const num = $panel.text().trim(); // 現在の数字を取得

        const $ghost = $(`<div class="frenzy-ghost"></div>`).css({
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            backgroundImage: `url(img/conum${num}_1.png)`, // まずは基本画像
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: 10000,
            pointerEvents: 'none'
        }).attr('data-home', i); // どのHOMEにいるか記録

        $('body').append($ghost);
        danceGhosts.push($ghost);
        $panel.css('visibility', 'hidden'); // 実体を隠す
    }
}


function createDanceGhosts() {
    clearAllDanceEffects();
    for (let i = 1; i <= 9; i++) {
        const $panel = $(`#p${i}`);
        const rect = $panel[0].getBoundingClientRect();
        // 現在のパネルに表示されている「数字」を取得
        const num = panelState[i-1]; 

        const $ghost = $(`<div class="frenzy-ghost"></div>`).css({
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            backgroundImage: `url(img/conum${num}_1.png)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: 10000,
            pointerEvents: 'none'
        }).attr('data-home', i).attr('data-num', num);

        $('body').append($ghost);
        danceGhosts.push($ghost);
        $panel.css('visibility', 'hidden');
    }
}

// 補助関数：指定したHOMEをタップした時の動きを再現
function danceStepLogic(targetHome, duration) {
    const clickedIdx = targetHome - 1;
    const routes = {
        0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
        2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
        4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
        6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
        8: [4, 5, 2, 1, 0, 3, 6, 7]
    };

    const targets = routes[clickedIdx];
    const ghosts = $(".frenzy-ghost");

    ghosts.each(function() {
        const $g = $(this);
        const currentPos = Number($g.attr('data-home')) - 1;

        if (currentPos === clickedIdx) {
            // タップされた場所はピョコっと跳ねる
            gsap.to($g, {
                y: -40,
                duration: duration / 2,
                yoyo: true,
                repeat: 1,
                ease: "power2.out"
            });
        } else if (targets.includes(currentPos)) {
            // それ以外は logicRotate のルートで移動
            const routeIdx = targets.indexOf(currentPos);
            const nextRouteIdx = (routeIdx + 7) % 8; 
            const nextPos = targets[nextRouteIdx];
            const rect = $(`#p${nextPos + 1}`)[0].getBoundingClientRect();

            gsap.to($g, {
                top: rect.top,
                left: rect.left,
                duration: duration,
                ease: "back.out(1.2)",
                onStart: () => {
                    // ここで居場所を更新することで、次のループの計算が正しくなる
                    $g.attr('data-home', nextPos + 1);
                }
            });
        }
    });
}


// ヘルパー関数：ルート計算（変更なし）
function getClockwisePath(start, goal) {
    const route = [1, 2, 3, 6, 9, 8, 7, 4];
    let idx = route.indexOf(start);
    let path = [start];
    for (let i = 0; i < 3; i++) {
        idx = (idx + 1) % 8; 
        path.push(route[idx]);
    }
    return path;
}

async function startHoneyLemonSequence() {
    console.log("Dance Start: しゅわしゅわハニーレモン350ml");
	 updateHyouji("ｼｭﾜｼｭﾜﾊﾆｰﾚﾓﾝ350ml", "success");

	$('body').addClass('dancing-bg');
    createBubbles();

	const checkAbort = () => {
        if (stopDanceRequest) {
            // ここで abortDance を呼べば、音も要素も一括でお掃除される
            abortDance(); 
            return true;
        }
        return false;
    };

	isDancing = true; // ダンス開始
    stopDanceRequest = false; // 中止リクエストをリセット
    
    const beat = 0.48; 
    const $allGhosts = $(".frenzy-ghost"); // 冒頭で一度だけ取得


	// await wait(4);   4拍待つ
const wait = (beats) => new Promise(r => setTimeout(r, beat * beats * 1000));

    // --- フェーズ1 & 2: 往復ダンス ---
    const fullRoute = [
        ...[1, 2, 3, 6, 9, 8, 7, 4], 
        ...[4, 7, 8, 9, 6, 3, 2, 1]  
    ];

    for (const home of fullRoute) {
	if (checkAbort()) return;
        for (let i = 0; i < 4; i++) {
            if (typeof danceStepLogic === "function") {
                danceStepLogic(home, beat * 0.8);
            }
            await new Promise(resolve => setTimeout(resolve, beat * 1000));
        }
    }

    // --- フェーズ3: サビ突入 ---
    console.log("サビ：フォーメーション展開開始！");
    const $g5 = $allGhosts.filter(function() { return $(this).attr('data-num') == "5"; });
    const otherNums = [2, 3, 6, 9, 8, 7, 4, 1];
    const others = otherNums.map(n => $allGhosts.filter(function() { return $(this).attr('data-num') == n; }));

    const $p5 = $("#p5");
    const p5Rect = $p5[0].getBoundingClientRect();
    const centerX = p5Rect.left;
    const centerY = p5Rect.top;

    let radius = 160; 
    let currentAngleOffset = 0;

    others.forEach(($g, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        gsap.to($g, {
            left: centerX + radius * Math.cos(angle),
            top: centerY + radius * Math.sin(angle),
            duration: beat,
            ease: "power2.out"
        });
    });
    gsap.to($g5, { left: centerX, top: centerY, duration: beat });

    await new Promise(resolve => setTimeout(resolve, beat * 1000));

    // --- フェーズ4: 加速公転 ---
	// --- フェーズ4: 加速公転 ---
if (checkAbort()) return;

let frenzyBeat = beat;
const totalSteps = 48; // 16ステップ(維持) + 32ステップ(加速) くらいが気持ちいいです
const initialRadius = radius; // 開始時の半径を保持

await wait(0.5);

for (let step = 0; step < totalSteps; step++) {
    if (checkAbort()) return;

    // 5番のジャンプ（ビートに合わせて）
    gsap.to($g5, { y: -50, duration: frenzyBeat * 0.4, yoyo: true, repeat: 1, ease: "power2.out" });

    // --- ロジックの分岐点 ---
    if (step < 16) {
        // 最初の4x4拍：変化なし（等速円運動）
        currentAngleOffset += 45; 
        // radius と frenzyBeat はそのまま維持
    } else {
        // 17ステップ目以降：急速に加速・収束
        currentAngleOffset += (45 + (step - 16) * 2); // 回転角もだんだん大きく
        radius = Math.max(10, radius * 0.85); // 0.97よりも急激に（指数関数的収束）
        
        if (frenzyBeat > 0.1) {
            frenzyBeat *= 0.88; // 速度も一気に上げる
        }
    }

    others.forEach(($g, i) => {
        const angle = (i * 45 - 90 + currentAngleOffset) * (Math.PI / 180);
        gsap.to($g, {
            left: centerX + radius * Math.cos(angle),
            top: centerY + radius * Math.sin(angle),
            duration: frenzyBeat * 0.9,
            ease: "none"
        });
    });

    await new Promise(resolve => setTimeout(resolve, frenzyBeat * 1000));
}

    // --- フェーズ5: はじけ飛び ---
	
if (checkAbort()) return;
console.log("はじけ跳ぶ！躍動感MAX！");

await new Promise(resolve => {
    let completed = 0;
    $allGhosts.each(function() {
        const $g = $(this);
        // 1. 爆発のベクトル：完全にランダムな方向へ
        const angle = Math.random() * Math.PI * 2;
        // 飛距離は画面外へ確実に消える程度に調整（1200は少し遠すぎるかもしれないので、300-500程度で十分な場合もあります）
        const dist = 500; 

        gsap.to($g, {
            // 現在位置から指定した方向へ吹っ飛ばす
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            rotation: "random(-720, 720)", // 激しく回転
            
            // 2. スケール：0にするのではなく、大きくして迫り出させる！
            scale: 3.0,           // 4倍まで巨大化して、カメラ（ユーザー）に向かってくる演出
            opacity: 0,           // 巨大化しながら消えていく
            
            duration: 1.0,        // 少し短くして爆発の瞬発力を出す
            ease: "expo.out",     // 最初が最高速で、徐々に減速する「爆発」のイージング
            
            onComplete: () => {
		gsap.set($g, { x: 0, y: 0, scale: 1 });
                completed++;
                if (completed === $allGhosts.length) resolve();
            }
        });
    });
});

// --- フェーズ6: 帰還シーケンス（連鎖バウンド・エラー対策版） ---
	if (checkAbort()) return;
console.log("フェーズ6: 連鎖帰還開始");

// 登場順と出現位置の定義
const returnSequence = [
    { num: 1, startHome: 8 }, { num: 4, startHome: 9 },
    { num: 7, startHome: 6 }, { num: 8, startHome: 3 },
    { num: 9, startHome: 2 }, { num: 6, startHome: 1 },
    { num: 3, startHome: 4 }, { num: 2, startHome: 7 }
];

// バウンド演出用の関数
const startBouncing = ($target) => {
    gsap.killTweensOf($target, "y"); // 既存のアニメーションを停止
    return gsap.to($target, { 
        y: -30, duration: beat / 2, yoyo: true, repeat: -1, ease: "power1.inOut" 
    });
};

// 【5番の復帰】変数名を重複しないよう「currentP5Rect」に変更
const currentP5Rect = $("#p5")[0].getBoundingClientRect();
gsap.set($g5, { 
    left: currentP5Rect.left + window.scrollX, 
    top: currentP5Rect.top + window.scrollY, 
    opacity: 1, scale: 1, rotation: 0 
});
startBouncing($g5);

// 数字が一人ずつ順番に帰還する処理
await wait(2);

for (const item of returnSequence) {
	if (checkAbort()) return;
    const $g = $allGhosts.filter(function() { return $(this).attr('data-num') == item.num; });
    const returnPath = getClockwisePath(item.startHome, item.num);

    // プロデューサーの分析通り、1拍目に登場して3拍（移動回数分）で着くように制御
    for (let i = 0; i < returnPath.length; i++) {
	if (checkAbort()) return;
        
	const rect = $(`#p${returnPath[i]}`)[0].getBoundingClientRect();
        const targetX = rect.left + window.scrollX;
        const targetY = rect.top + window.scrollY;

        if (i === 0) {
            // 1拍目：出現（待機なしで即座に次の移動命令へ）
		
            gsap.set($g, { left: targetX, top: targetY, opacity: 1, scale: 1, rotation: 0 });
		await wait(0.9);
        } else {
            // 2〜4拍目：移動
            gsap.to($g, { 
                left: targetX, 
                top: targetY, 
                duration: beat*0.9, 
                ease: "power1.inOut" 
            });
            
            // 移動のアニメーションが終わる（1拍分）のを待つ
            await new Promise(r => setTimeout(r, beat * 1000));
        }

		
    }
    
    // 【重要】HOMEに収まった瞬間にピョコピョコ開始！
    startBouncing($g);

    }

// --- フェーズ7: フィナーレ・ダンス（バウンド強制停止・軌道重視版） ---
	if (checkAbort()) return;
console.log("フェーズ7: 移動するグループのバウンドを止めて開始します");

const oddsExcluding5 = $allGhosts.filter(function() { 
    const n = parseInt($(this).attr('data-num'));
    return n % 2 !== 0 && n !== 5; 
});
const evens = $allGhosts.filter(function() { 
    const n = parseInt($(this).attr('data-num'));
    return n % 2 === 0; 
});

const squeeze5 = (isSqueezed) => {
    gsap.to($g5, { scale: isSqueezed ? 0.7 : 1.0, duration: beat, ease: "power2.out" });
};

// --- フェーズ7: 軌道完全補正版（移動＋ジャンプの合成） ---

const danceJump = async (group, isApproaching) => {
    const p5Rect = $("#p5")[0].getBoundingClientRect();
    const centerX = p5Rect.left + window.scrollX;
    const centerY = p5Rect.top + window.scrollY;

    group.each(function() {
        const $this = $(this);
        const rect = $this[0].getBoundingClientRect();
        
        if (isApproaching) {
            gsap.killTweensOf($this); 
            gsap.set($this, { y: 0 });

            const moveX = (centerX - (rect.left + window.scrollX)) * 0.5;
            const moveY = (centerY - (rect.top + window.scrollY)) * 0.5;
            
            // 【修正の核心】
            // 1拍の中で「移動」を完了させつつ、y軸だけ「山なりのカーブ」を強くかける。
            // 目的地（moveY）へ着地することを最優先し、その道中だけ少し浮かせる設定です。
            gsap.to($this, { 
                x: moveX, 
                // 目標の高さ(moveY)へ直接向かわせつつ、
                // CustomWiggleのような動きではなく、シンプルな power2.out で「吸い込み」を強調
                y: moveY, 
                duration: beat, 
                ease: "power2.inOut",
                onUpdate: function() {
                    // アニメーションの進行度(0〜1)を取得
                    const progress = this.progress();
                    // 放物線の計算：進行度が0.5の時に最大(-30px程度)浮かせ、着地点では0に戻る
                    // これにより、上段・下段に関わらず「5番へ向かう線」の上にジャンプが乗ります
                    const jumpHeight = Math.sin(progress * Math.PI) * -30;
                    gsap.set($this, { y: moveY * progress + jumpHeight });
                }
            });

        } else {
            // HOMEへ戻る
            gsap.to($this, { 
                x: 0, 
                y: 0, 
                duration: beat, 
                ease: "power2.inOut",
                onComplete: () => {
                    startBouncing($this); 
                }
            });
        }
    });
};
// --- ダンス・メイン・シーケンス（全とっかえ） ---
for (let loop = 0; loop < 4; loop++) {
	if (checkAbort()) return;
    for (let i = 0; i < 2; i++) {
	if (checkAbort()) return;
        squeeze5(true);
        danceJump(evens, true);  
        await wait(1); 
        
        squeeze5(false);
        danceJump(evens, false); 
        await wait(1); 
    }
    for (let i = 0; i < 2; i++) {
	if (checkAbort()) return;
        squeeze5(true);
        danceJump(oddsExcluding5, true);
        await wait(1);
        
        squeeze5(false);
        danceJump(oddsExcluding5, false);
        await wait(1);
    }
}

// --- フェーズ8: カーテンコール（一人ずつ舞台を去る） ---
    // ここが startHoneyLemonSequence 関数の「内側」であることを確認
    console.log("フェーズ8: カーテンコール（退場）");

    // クラス名が '.frenzy-ghost' か '.ghost-num' か、実際に付与している方を使ってください
    const finalGhosts = Array.from(document.querySelectorAll('.frenzy-ghost'));

    // シャッフル
    for (let i = finalGhosts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalGhosts[i], finalGhosts[j]] = [finalGhosts[j], finalGhosts[i]];
    }

    // BGMの音量を徐々に下げる（danceAudioが定義されている前提）
    if (typeof danceAudio !== 'undefined' && danceAudio) {
        gsap.to(danceAudio, { volume: 0, duration: 10 });
    }

    for (const ghost of finalGhosts) {
        gsap.to(ghost, {
            duration: 1,
            scale: 0,
            opacity: 0,
            y: "-=20",
            ease: "power2.in",
            onComplete: () => {
                if (ghost.parentNode) ghost.remove();
            }
        });
        
        // 次の人が消えるまでの待ち時間を増やす
    // 0.2拍だと速いので、0.5拍〜0.8拍くらいにすると音が消える速度と同期しやすくなります
    await wait(0.9);
    }
	await wait(5);
    // 最後に音を止める
    if (typeof danceAudio !== 'undefined' && danceAudio) {
        danceAudio.pause();
        danceAudio = null; 
    }

    // お掃除とフラグ解禁
    clearAllDanceEffects();
    isDancing = false;
    isLocked = false;

    console.log("Dance Sequence Complete: The stage is clear.");

} // ← startHoneyLemonSequence はここで閉じる！


// タイムラインに直接アニメーションを予約する関数
function addDanceStepToTimeline(timeline, targetHome, startTime, duration) {
    const clickedIdx = targetHome - 1;
    const routes = {
        0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
        2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
        4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
        6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
        8: [4, 5, 2, 1, 0, 3, 6, 7]
    };

    const targets = routes[clickedIdx];
    const ghosts = $(".frenzy-ghost");

    ghosts.each(function() {
        const $g = $(this);
        const currentPos = Number($g.attr('data-home')) - 1;

        if (currentPos === clickedIdx) {
            // ピョコ
            timeline.to($g, {
                y: -40,
                duration: duration / 2,
                yoyo: true,
                repeat: 1,
                ease: "power1.inOut"
            }, startTime);
        } else if (targets.includes(currentPos)) {
            // 移動
            const routeIdx = targets.indexOf(currentPos);
            const nextRouteIdx = (routeIdx + 7) % 8; 
            const nextPos = targets[nextRouteIdx];
            const rect = $(`#p${nextPos + 1}`)[0].getBoundingClientRect();

            timeline.to($g, {
                top: rect.top,
                left: rect.left,
                duration: duration,
                ease: "none", // テンポ重視なら ease は none か power1.out が安定
                onStart: () => $g.attr('data-home', nextPos + 1)
            }, startTime);
        }
    });
}

// 泡を生成して飛ばす関数
function createBubbles() {
    console.log("泡生成プロセス開始"); // ブラウザのコンソールでこれが出るか確認！
    
    for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'lemon-bubble';
        
        // サイズと位置を直接指定（JS側で確実に数値を入れます）
        const size = Math.random() * 20 + 15 + "px"; // 少し大きめに 10-25px
        const left = Math.random() * 100 + "%";
        
        bubble.style.width = size;
        bubble.style.height = size;
        bubble.style.left = left;
        
        document.body.appendChild(bubble); // bodyに直接追加

        // GSAPで動かす
        gsap.to(bubble, {
            y: -window.innerHeight - 100,
            x: "random(-30, 30)",
            duration: Math.random() * 3 + 4,
            delay: Math.random() * 5,
            repeat: -1,
            ease: "none"
        });
    }
}
// 泡を消去する関数
function clearBubbles() {
    gsap.killTweensOf(".lemon-bubble");
    $(".lemon-bubble").remove();
}

// 補助関数：Promiseを返さず、即座にアニメーションを開始するロジック
function danceStepLogic(targetHome, duration) {
    const clickedIdx = targetHome - 1;
    const routes = {
        0: [4, 3, 6, 7, 8, 5, 2, 1], 1: [4, 0, 3, 6, 7, 8, 5, 2],
        2: [4, 1, 0, 3, 6, 7, 8, 5], 3: [4, 6, 7, 8, 5, 2, 1, 0],
        4: [1, 0, 3, 6, 7, 8, 5, 2], 5: [4, 2, 1, 0, 3, 6, 7, 8],
        6: [4, 7, 8, 5, 2, 1, 0, 3], 7: [4, 8, 5, 2, 1, 0, 3, 6],
        8: [4, 5, 2, 1, 0, 3, 6, 7]
    };

    const targets = routes[clickedIdx];
    const ghosts = $(".frenzy-ghost");

    ghosts.each(function() {
        const $g = $(this);
        const currentPos = Number($g.attr('data-home')) - 1;

        if (currentPos === clickedIdx) {
            gsap.to($g, {
                y: -40,
                duration: duration / 2,
                yoyo: true,
                repeat: 1,
                ease: "power2.out"
            });
        } else if (targets.includes(currentPos)) {
            const routeIdx = targets.indexOf(currentPos);
            const nextRouteIdx = (routeIdx + 7) % 8; 
            const nextPos = targets[nextRouteIdx];
            
            const $nextPanel = $(`#p${nextPos + 1}`);
            const rect = $nextPanel[0].getBoundingClientRect();

            gsap.to($g, {
                top: rect.top,
                left: rect.left,
                duration: duration,
                ease: "back.out(1.2)",
                onStart: () => {
                    $g.attr('data-home', nextPos + 1);
                }
            });
        }
    });
}
	
   // 【復旧版】画像・背景色・アニメーションを全て網羅
async function refreshPanelsExt(mode = "normal") {
    // 1. 既存のアニメーションとゴーストの掃除
    if (winAnims && winAnims.length > 0) {
        winAnims.forEach(anim => anim.kill());
        winAnims = [];
    }
    $(".celebrate-chara").remove();
    // ダンス用ゴーストも掃除（もし存在すれば）
    if (typeof clearAllDanceEffects === "function") clearAllDanceEffects();

    // 2手目の時だけ、事前に「どの3つを変化させるか」を決める[cite: 1]
    let specialThree = [];
    if (mode === "win" && selectedSteps === 2) {
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        specialThree = nums.sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    const steps = Math.max(1, selectedSteps);

    // 【重要】6手以上の場合は、個別パネルの更新をスキップしてダンスシーケンスへ[cite: 1]
    if (mode === "win" && steps >= 6) {
        isLocked = true;
        // 音楽再生
        danceAudio = new Audio('sound/h_lemon.mp3');
        danceAudio.play();

        // ゴースト生成とダンス開始
        if (typeof createDanceGhosts === "function") {
            createDanceGhosts();
            await startHoneyLemonSequence(); 
        }
        return; // ここで終了
    }

    // --- 通常時、および1〜5手のご褒美演出 ---[cite: 1]
    panelState.forEach((num, index) => {
        const targetId = `#p${index + 1}`;
        gsap.set(targetId, { clearProps: "transform,scale,background-image" });

        if (mode === "win") {
            let imgFile = null;
            let shouldAnimate = false;

            if (steps === 1) {
                // 1手：変化なし[cite: 1]
            } else if (steps === 2) {
                if (specialThree.includes(num)) {
                    let type = Math.random() < 0.5 ? "_1" : "_2";
                    imgFile = `conum${num}${type}.png`;
                }
            } else if (steps === 3) {
                let type = Math.random() < 0.5 ? "_1" : "_2";
                imgFile = `conum${num}${type}.png`;
            } else if (steps <= 5) {
                // 4手・5手：全員変化 ＋ 動きあり[cite: 1]
                let type = Math.random() < 0.5 ? "_1" : "_2";
                imgFile = `conum${num}${type}.png`;
                shouldAnimate = true;
            }

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
                $(targetId).css('background-image', 'none');

                if (shouldAnimate) {
                    const power = steps - 3; // 4手:1, 5手:2[cite: 1]
                    const jumpY = -20 * power; 
                    const jumpX = 15 * power;
                    const rotDeg = 8 * power;
                    const startDir = (index % 2 === 0) ? 1 : -1;
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
        <p>First, make sure the button on the top-left is set to <span style="color:#4fc3f7; font-weight:bold;">[SINGLE]</span>, then tap any number above!</p>
        <p>See? We're all jumping around!</p>		
        <p>The rule is super easy: <span style="color:#e74c3c; font-weight:bold;">The number you tap stays still. All the others hop one spot clockwise!</span></p>

        <p style="margin-top:10px;">
        <p>Use the red buttons to pick a difficulty from 0 to 6.</p>
        <p>Pick <span style="color:#ef5350; font-weight:bold;">[0]</span> and hit <span style="color:#ffd54f; font-weight:bold;">[SET]</span>. We’ll show you our <span style="color:#8bc34a; font-weight:bold;">"HOME"</span>!</p>
        <p>The goal is to lead every number back to its <span style="color:#8bc34a; font-weight:bold;">"HOME"</span>!</p>
  
        <p style="margin-top:10px;">
        <p>Now, pick <span style="color:#ef5350; font-weight:bold;">[1]</span> and hit <span style="color:#ffd54f; font-weight:bold;">[SET]</span>!</p>
        <p>You can reach the goal in just one tap.</p>
        <p>Here’s a hint: <span style="color:#8bc34a; font-weight:bold;">Just tap the one number you want to keep in its place!</span></p>

        <p style="margin-top:10px;">
        <p>Once you've got it, try picking <span style="color:#ef5350; font-weight:bold;">[2]</span> and hit <span style="color:#ffd54f; font-weight:bold;">[SET]</span>.</p>
        <p>It gets trickier and trickier as the numbers go up!</p>

        <p style="margin-top:10px;">
        <p>In <span style="color:#4fc3f7; font-weight:bold;">[SINGLE]</span> mode, we move with every tap. In <span style="color:#4fc3f7; font-weight:bold;">[COMBO]</span> mode, we wait until you enter all your moves.</p>

        <p style="margin-top:10px;">
        <p>Tap <span style="color:#8bc34a; font-weight:bold;">[PEEK]</span> to glimpse the first move, and use <span style="color:#8bc34a; font-weight:bold;">[FORBIDDEN FRUIT]</span> at your own risk♪</p>
            
        <p style="margin-top:10px;">
        <p>Ready for a real test? Try the <span style="color:#90a4ae; font-weight:bold;">Daily Challenge</span>!</p>
        <p><span style="color:#90a4ae; font-weight:bold;">[MODE 3]</span> takes 3 taps, and <span style="color:#90a4ae; font-weight:bold;">[MODE 4]</span> takes 4. Which will you choose?</p>
        <p>Hit <span style="color:#90a4ae; font-weight:bold;">[START]</span> to race players from all over the world!</p>

        <p>You can check the scores with <span style="color:#90a4ae; font-weight:bold;">[RANK]</span>.</p>
        <p>Can you make it into the TOP 5?</p>
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
	<p><span style="color:#ef5350; font-weight:bold;">[0]</span>を選んでから <span style="color:#ffd54f; font-weight:bold;">[SET]</span> を押すと、僕たちの <span style="color:#8bc34a; font-weight:bold;">「HOME」</span> を教えてあげるね</p>
	<p>パズルのゴールは、みんなをこの<span style="color:#8bc34a; font-weight:bold;">「HOME」</span>に連れていくことだよ！</p>
  
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
	<p><span style="color:#8bc34a; font-weight:bold;">[PEEK]</span> で最初の一手がのぞけるし、 <span style="color:#8bc34a; font-weight:bold;">[FORBIDDEN FRUIT]</span> は自己責任で♪</p>
            
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
	if (isDancing) {
        abortDance();
    }
	if (isAnimating) return;
	
    playSnd('click');
    openHowToModal();
});

    $('.bot').click(function() {
	if (isDancing) {
        abortDance();
    }

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
	if (isDancing) {
        abortDance();
    }
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
	if (isDancing) {
        abortDance();
    }
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
	if (isDancing) {
        abortDance();
    }
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
	if (isDancing) {
        abortDance();
    }
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
	if (isDancing) {
        abortDance();
    }
        isSoundOn = !isSoundOn;
        $(this).css("opacity", isSoundOn ? "1.0" : "0.5");
        if(isSoundOn) playSnd('click');
    });

    $("#peek-btn").on("click", function() {
	if (isDancing) {
        abortDance();
    }
        if (currentAnswer.length === 0 || isAnimating) return;
        $(this).text(`FIRST: ${currentAnswer[0]}`);
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => { $(this).text("PEEK"); }, 3000);
    });

    $("#kotae").on("click", function() {
	if (isDancing) {
        abortDance();
    }
        if (currentAnswer.length === 0 || isAnimating) return;
        $(this).text(currentAnswer.join(" - "));
        setTimeout(() => { $(this).text("Forbidden fruit"); }, 3000);
    });

    refreshPanels();
});