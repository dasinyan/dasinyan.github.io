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

// 各モードの計測が走っているか管理するフラグ
let isTimerActive = { 3: false, 4: false };

// --- 1. 状態管理に「チュートリアルの種類」を追加 ---
let tutorialType = "basic"; // "basic"（初回用） か "hint"（ヒント用） か

let isArrowExperimentMode = false; // 矢印実験フラグ（初期値はオフ）

// --- 2. 16箇所の座標（位置番号）の自動計算設定 ---
const PANEL_SIZE = 100; // パネルの幅・高さ
const GAP = 10;        // gridの隙間

// 各行・列の中心座標（0, 1, 2番目）
const gridPos = [
    (PANEL_SIZE / 2),                           // 50px
    (PANEL_SIZE + GAP + PANEL_SIZE / 2),        // 160px
    (PANEL_SIZE * 2 + GAP * 2 + PANEL_SIZE / 2)   // 270px
];

// 各隙間の中心座標
const gapPos = [
    (PANEL_SIZE + GAP / 2),                     // 105px（1つ目の隙間）
    (PANEL_SIZE * 2 + GAP + GAP / 2)            // 215px（2つ目の隙間）
];

// --- 状態管理エリアへ追加する新規変数 ---
let comboStartTime = 0;      // COMBOモードの計測開始タイムスタンプ
let usedCheatFlag = false;     // PEEKや禁断の果実（カンニング）を使ったかのフラグ
let isComboTiming = false;    // 現在COMBOモードでタイム計測中かどうかのフラグ


// --- 状態管理エリアに新しく追加する変数 ---
let challengeOriginalTime = null; // 挑戦状の主の記録（比較用）
let isFromChallenge = false;       // 誰かの挑戦状から起動されたかのフラグ


// 🌟 あなたの設計通り、完全に16箇所で完結するマスター配列
const ARROW_POSITIONS = [
    // --- 縦・横の直線的な隙間（12箇所：0 〜 11） ---
    /* 0 */  { x: gapPos[0], y: gridPos[0] }, // 1行目・左の隙間
    /* 1 */  { x: gapPos[1], y: gridPos[0] }, // 1行目・右の隙間
    /* 2 */  { x: gapPos[0], y: gridPos[1] }, // 2行目・左の隙間
    /* 3 */  { x: gapPos[1], y: gridPos[1] }, // 2行目・右の隙間
    /* 4 */  { x: gapPos[0], y: gridPos[2] }, // 3行目・左の隙間
    /* 5 */  { x: gapPos[1], y: gridPos[2] }, // 3行目・右の隙間
    
    /* 6 */  { x: gridPos[0], y: gapPos[0] }, // 1列目・上の隙間
    /* 7 */  { x: gridPos[0], y: gapPos[1] }, // 1列目・下の隙間
    /* 8 */  { x: gridPos[1], y: gapPos[0] }, // 2列目・上の隙間
    /* 9 */  { x: gridPos[1], y: gapPos[1] }, // 2列目・下の隙間
    /* 10 */ { x: gridPos[2], y: gapPos[0] }, // 3列目・上の隙間
    /* 11 */ { x: gridPos[2], y: gapPos[1] }, // 3列目・下の隙間

    // --- 四隅と中央を繋ぐ斜めの隙間（4箇所：12 〜 15） ---
    /* 12 */ { x: (gridPos[0] + gridPos[1]) / 2, y: (gridPos[0] + gridPos[1]) / 2 }, // 左上と中央の間 (105px, 105px)
    /* 13 */ { x: (gridPos[2] + gridPos[1]) / 2, y: (gridPos[0] + gridPos[1]) / 2 }, // 右上と中央の間 (165px, 105px)
    /* 14 */ { x: (gridPos[0] + gridPos[1]) / 2, y: (gridPos[2] + gridPos[1]) / 2 }, // 左下と中央の間 (105px, 165px)
    /* 15 */ { x: (gridPos[2] + gridPos[1]) / 2, y: (gridPos[2] + gridPos[1]) / 2 }  // 右下と中央の間 (165px, 165px)
];
const TUTORIAL_ARROW_MAP = {
    // 🟥 0: 左上パネルがタップされた時（5の場所から1の場所へ斜めに脱出！）
    0: [
        { posIdx: 8,  angle: 0 }, // 中央上から真ん中へ（下向き）
        { posIdx: 7,  angle: 0 }, // 🌟 5から1の場所へ（左上斜め向き）
        { posIdx: 2,  angle: 90 }, // 左中央から左下へ（下向き）
        { posIdx: 4,  angle: 270 }, // 下中央から左下へ（左向き）
        { posIdx: 5,  angle: 270 }, // 右下から下中央へ（左向き）
        { posIdx: 11, angle: 180 },   // 右下から右中央へ（上向き）
        { posIdx: 10, angle: 180 },   // 右中央から右上へ（上向き）
        { posIdx: 1,  angle: 90 }  // 右上から中央上へ（左向き）
    ],

    // 🟦 1: 上中央パネルがタップされた時（7の場所から5の場所へ斜めに入る！）
    1: [
        { posIdx: 7,  angle: 0 }, // 中央上から左上へ（左向き）
        { posIdx: 6,  angle: 0 },   // 左中央から左上へ（上向き）
        { posIdx: 12, angle: 135 },   // 真ん中から中央上へ（上向き）
        { posIdx: 13, angle: 45 },  // 中央上から右上へ（右向き）
        { posIdx: 10, angle: 180 }, // 右上から右中央へ（下向き）
        { posIdx: 11, angle: 180 }, // 右中央から右下へ（下向き）
        { posIdx: 5,  angle: 270 }, // 右下から下中央へ（左向き）
        { posIdx: 4,  angle: 270 }    // 🌟 左下から真ん中へ（右上斜め向き）
    ],

    // 🟥 2: 右上パネルがタップされた時（5の場所から3の場所へ斜めに脱出！）
    2: [
        { posIdx: 0,  angle: 90 },  // 左上から中央上へ（右向き）
        { posIdx: 8,  angle: 180 },  // 🌟 5から3の場所へ（右上斜め向き）
        { posIdx: 3,  angle: 90 }, // 右中央から右下へ（下向き）
        { posIdx: 11, angle: 180 }, // 右下から下中央へ（左向き）
        { posIdx: 5,  angle: 270 }, // 下中央から左下へ（左向き）
        { posIdx: 4,  angle: 270 },   // 左下から左中央へ（上向き）
        { posIdx: 7,  angle: 0 },   // 左中央から左上へ（上向き）
        { posIdx: 6,  angle: 0 }   // 左中央から真ん中へ（右向き）
    ],

    // 🟦 3: 左中央パネルがタップされた時（5から1の場所へ斜めに脱出！）
    3: [
        { posIdx: 0,  angle: 90 },  // 左上から中央上へ（右向き）
        { posIdx: 1,  angle: 90 },  // 中央上から右上へ（右向き）
        { posIdx: 10, angle: 180 }, // 右上から右中央へ（下向き）
        { posIdx: 11, angle: 180 }, // 右中央から真ん中へ（下向き）
        { posIdx: 5,  angle: 270 }, // 左中央から左下へ（下向き）
        { posIdx: 4,  angle: 270 },  // 左下から下中央へ（右向き）
        { posIdx: 14, angle: 45 },   // 下中央から真ん中へ（上向き）
        { posIdx: 12, angle: 315 }  // 🌟 5から1の場所へ（左上斜め向き）
    ],

    // 🟩 4: 中央パネルがタップされた時（綺麗な外周正方形サイクル）
    4: [
        { posIdx: 0,  angle: 90 },  // 1→2（右向き）
        { posIdx: 1,  angle: 90 },  // 2→3（右向き）
        { posIdx: 10, angle: 180 }, // 3→6（下向き）
        { posIdx: 11, angle: 180 }, // 6→9（下向き）
        { posIdx: 5,  angle: 270 }, // 9→8（左向き）
        { posIdx: 4,  angle: 270 }, // 8→7（左向き）
        { posIdx: 7,  angle: 0 },   // 7→4（上向き）
        { posIdx: 6,  angle: 0 }    // 4→1（上向き）
    ],

    // 🟦 5: 右中央パネルがタップされた時（5から3の場所へ斜めに脱出！）
    5: [
        { posIdx: 1,  angle: 90 },   // 左中央から真ん中へ（上向き）
        { posIdx: 13, angle: 225 },  // 🌟 5から3の場所へ（右上斜め向き）
        { posIdx: 15, angle: 135 }, // 右中央から右下へ（下向き）
        { posIdx: 5,  angle: 270 }, // 右下から下中央へ（左向き）
        { posIdx: 4,  angle: 270 }, // 下中央から左下へ（左向き）
        { posIdx: 7,  angle: 0 },   // 左下から左中央へ（上向き）
        { posIdx: 6,  angle: 0 },   // 左中央から左上へ（上向き）
        { posIdx: 0,  angle: 90 }   // 左上から中央上へ（右向き）
    ],

    // 🟥 6: 左下パネルがタップされた時（5から7の場所へ斜めに脱出！）
    6: [
        { posIdx: 0,  angle: 90 },  // 左上から中央上へ（右向き）
        { posIdx: 1,  angle: 90 },  // 中央上から右上へ（右向き）
        { posIdx: 10, angle: 180 }, // 右上から右中央へ（下向き）
        { posIdx: 11, angle: 180 }, // 右中央から真ん中へ（左向き）
        { posIdx: 5,  angle: 270 }, // 🌟 5から7の場所へ（左下斜め向き）
        { posIdx: 9,  angle: 0 },  // 左下から下中央へ（右向き）
        { posIdx: 2,  angle: 270 },   // 右下から右中央へ（上向き）
        { posIdx: 6,  angle: 0 }    // 下中央から真ん中へ（上向き）
    ],

    // 🟦 7: 下中央パネルがタップされた時（1から5の場所へ斜めに入る！）
    7: [
        { posIdx: 10, angle: 180 },  // 左下から下中央へ（右向き）
        { posIdx: 11, angle: 180 }, // 真ん中から下中央へ（下向き）
        { posIdx: 15, angle: 315 }, // 右下から下中央へ（左向き）
        { posIdx: 14, angle: 225 },   // 右下から右中央へ（上向き）
        { posIdx: 7,  angle: 0 },   // 右中央から右上へ（上向き）
        { posIdx: 6,  angle: 0 }, // 右上から中央上へ（左向き）
        { posIdx: 0,  angle: 90 }, // 中央上から左上へ（左向き）
        { posIdx: 1,  angle: 90 }  // 🌟 左上から真ん中へ（右下斜め向き）
    ],

    // 🟥 8: 右下パネルがタップされた時（5から9の場所へ斜めに脱出！）
    8: [
        { posIdx: 6,  angle: 0 },  // 左上から中央上へ（右向き）
        { posIdx: 0,  angle: 90 },   // 真ん中から中央上へ（上向き）
        { posIdx: 1,  angle: 90 },  // 中央上から右上へ（右向き）
        { posIdx: 10, angle: 180 }, // 右上から右中央へ（下向き）
        { posIdx: 3, angle: 270 }, // 🌟 5から9の場所へ（右下斜め向き）
        { posIdx: 9,  angle: 180 }, // 右下から下中央へ（左向き）
        { posIdx: 4,  angle: 270 }, // 下中央から左下へ（左向き）
        { posIdx: 7,  angle: 0 }    // 左下から左中央へ（上向き）
    ]
};
	
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

let currentLang = (navigator.language && navigator.language.startsWith('ja')) ? 'ja' : 'en';

// --- チュートリアル用のデータ管理 ---
    let tutorialStep = 0; // 現在どのステップか (0番目からスタート)

// 進行管理用のフラグ
let hasPressedTarget = false;

const tutorialData = [
   　　 { 
        target: "#p1",
        message: {
            ja: "Cyclogic Pop の世界にようこそ！<br>僕が遊び方を紹介するね",
            en: "Welcome to Cyclogic Pop!<br>Let me show you how to play!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },    
	{ 
        target: "#p5",
        message: {
            ja: "僕たちを好きに押してみてくれるかな<br>それに合わせて、みんなが飛び回るよ",
            en: "Go ahead and tap any of us!<br>Everyone will start flying around!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"]
    },
		{ 
        target: "#p5",
        message: {
            ja: "自由に飛んでるように見えるけど<br>実は移動にはルールがあるんだ<br>解るかな？",
            en: "We might look like we're flying free,<br>but we actually follow a specific rule.<br>Can you figure it out?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"]
    },
		{ 
        target: "#p5",
        message: {
            ja: "押された数字は動かない！<br>他のみんなが時計回りに<br>一つとなりのマスに動くんだ",
            en: "The number you tap stays still!<br>Everyone else moves clockwise<br>to the very next space."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"]
    },
	{ 
        target: "#p5",
        message: {
            ja: "ちょっとみんな説明中だから<br>飛ばないでじっとしてて・・・",
            en: "Whoa, hold on everyone!<br>I'm trying to explain!<br>No jumping yet, just stay right there..."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"]
    },

		{ 
        target: "#p5",
        message: {
            ja: "やっと止まったくれた<br>みんな！ありがとね！",
            en: "Finally, they stopped moving...<br>Thanks, everyone!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9],

	// 🌟 ステップ開始時にフラグを立てる
    onStepStart: function() {
        isArrowExperimentMode = true;
    }
    },
	{ 
        target: "#p5",
        message: {
            ja: "数字を押すと矢印が見えるでしょ<br>押された数字は動かずに<br>他のみんなが矢印の向きに跳んでいくんだ",
            en: "See the arrows when you tap a number?<br>The number you tapped stays in place,<br>and everyone else jumps in that direction!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9],

	// 🌟 ステップ開始時にフラグを立てる
    onStepStart: function() {
        isArrowExperimentMode = true;
    }
    },
	
{ 
        target: "#p5",
        message: {
            ja: "みんなが止まってくれてる間に<br>解るまで押してみてね",
            en: "While everyone is staying still,<br>keep tapping until you get how it works!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9],

	// 🌟 ステップ開始時にフラグを立てる
    onStepStart: function() {
        isArrowExperimentMode = true;
    }
    },

	{ 
        target: "#p5",
        message: {
            ja: "解ってくれたかな？<br>何回か押して確認してみて<br>OKなら話を進めるよ",
            en: "Do you get it now?<br>Tap a few more times to be sure.<br>Ready to move on?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"],
	// 🌟 次のステップ開始時（＝前のステップが進行した時）にフラグを折り、矢印を消す
        onStepStart: function() {
        isArrowExperimentMode = false;
        clearTutorialArrows(); // 矢印を消す関数を呼ぶ
        },
	check: function() {
          if (!hasPressedTarget) {
         
              return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },

		{ 
        target: "#tebo",
        message: {
            ja: "このボタンが「０」の時に",
            en: "When this button shows \"0\"..."
        },
        pos: { x: 0, y:600 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
		{ 
        target: "#sebo",
        message: {
            ja: "このSETボタンを押してみて<br>僕たちが整列したでしょ",
            en: "Give this SET button a push!<br>Look, we're all lined up now!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#sebo"],
	check: function() {
          if (!hasPressedTarget) {
         
              return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
		{ 
        target: "#p2",
        message: {
            ja: "このプッシュホンと同じ数字の配置を<br>僕たちは「HOME」と呼んでるんだ",
            en: "We call this keypad layout our \"HOME\"!<br>It's just like an old office phone."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
		{ 
        target: "#p5",
        message: {
            ja: "パズルの目的は僕たちを動かして<br>みんなでHOMEを目指すことだよ",
            en: "The goal is to move all of us<br>so we can get BACK TO HOME together!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#tebo",
        message: {
            ja: "このボタンを押すと<br>表示されてる数字が<br>０～６で入れ替わるよ",
            en: "Press this button<br>to swap the numbers<br>from 0 to 6!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#tebo"]	   
    },
	{ 
        target: "#tebo",
        message: {
            ja: "ボタンを何度か押して<br>数字を「１」にしよう",
            en: "Keep pressing it<br>until you get the number 1!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#tebo"],
	check: function() {
        // #teboのテキストを数字に変換して、1と一致するか判定
        return parseInt($("#tebo").text()) === 1;
	}
    },
	{ 
        target: "#sebo",
        message: {
            ja: "隣のボタンが「１」の時に<br>SETを押すと・・・",
            en: "When the next button<br>shows \"1\", try pressing<br>the SET button..."
        },
        pos: { x: 0, y:600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#sebo"],
	
        check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
      	
    },
	
	{ 
        target: "#p5",
        message: {
            ja: "僕たちの配置があと１回押せば<br>HOMEに辿り着く配置になるんだ",
            en: "Just one more press<br>will put our layout<br>right into HOME!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "何度かSETを押して観察してみて",
            en: "Press SET a few times<br>and watch closely<br>to see what happens!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: ["#sebo"],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p5",
        message: {
            ja: "気が付いたかもしれないけど<br>僕たちが自分のHOMEにいると<br>マスが体と同じ色になるよ",
            en: "You might have noticed,<br>when we are in our HOME,<br>the slots match our color!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: ["#sebo"]
    },
	{ 
        target: "#tebo",
        message: {
            ja: "この数字は難易度で<br>あと何回押せばHOMEに辿り着けるかを<br>表してるよ",
            en: "This difficulty number<br>shows how many presses<br>are left to reach HOME!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#sebo",
        message: {
            ja: "SETを押すと<br>「となりの数字の回数押せばHOME」<br>って配置が表示される",
            en: "Press SET, and it shows<br>the layout to reach HOME<br>in \"next number\" moves!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#tebo",
        message: {
            ja: "ここに表示されてる数字<br>つまり回数をヒントにして・・・",
            en: "Use this number here<br>as your count hint,<br>and then..."
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#sebo",
        message: {
            ja: "SETを押して現れた配置から<br>HOMEを目指すパズルだよ",
            en: "Just clear the puzzle<br>by reaching HOME from<br>the layout that appears!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#input-mode",
        message: {
            ja: "これは入力の仕方を変えるボタンで<br>押すとSINGLEとCOMBOが選べるよ",
            en: "This button changes<br>the input mode to select<br>SINGLE or COMBO!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"]
    },
	{ 
        target: "#input-mode",
        message: {
            ja: "SINGLEは数字を押すたび<br>他の数字たちが動くんだ",
            en: "In SINGLE, every press<br>makes all the other<br>numbers move around!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"]
    },
	{ 
        target: "#input-mode",
        message: {
            ja: "毎回動くから動きに慣れるまでは<br>SINGLEがおすすめだね",
            en: "They move every time,<br>so I recommend SINGLE<br>until you get used to it!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"]
    },

	{ 
        target: "#input-mode",
        message: {
            ja: "COMBOは全ての答えの入力が終わるまで<br>僕らはじっと待っていて<br>全て入力されたら一気に動くよ",
            en: "In COMBO, we wait quietly<br>until you finish entering,<br>then move all at once!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"]
    },
　　　　{ 
        target: "#input-mode",
        message: {
            ja: "試しにCOMBOにしてみて",
            en: "Give it a try and<br>switch the mode to COMBO!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"],
	check: function() {
        // テキストをトリミング（前後の空白削除）して比較
        return $("#input-mode").text().trim() === "COMBO";
    }

    },
	{ 
        target: "#tebo",
        message: {
            ja: "ここを「５」にしてみて",
            en: "Let\'s try setting<br>this one to \"5\"!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#tebo"],
	check: function() {
        // #teboのテキストを数字に変換して、1と一致するか判定
        return parseInt($("#tebo").text()) === 5;
	}
    },
	{ 
        target: "#p2",
        message: {
            ja: "-----の部分に数字が溜まっていくんだ",
            en: "The numbers will pile up<br>right here in the<br>----- section!"
        },
        pos: { x: 0, y: 600 },
        radius: 130,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#sebo",
        message: {
            ja: "SETを押してみよう",
            en: "Let\'s try pressing<br>the SET button!"
        },
        pos: { x: 0, y:600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#sebo"],
	
        check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
      	
    },

	{ 
        target: "#p5",
        message: {
            ja: "ちょっと難しいから<br>なんでもいいから数字を５回<br>試しに押してみよう",
            en: "It might look tricky, so<br>just press any numbers<br>5 times to try it out!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: [".panel"]
    },
	{ 
        target: "#p5",
        message: {
            ja: "基本的な操作方法は判ってくれたかな<br>難易度は一つ上がるだけで<br>大きく難しくなるから<br>１から徐々に上げていこう",
            en: "Got the basic controls?<br>It gets way harder with<br>just +1 difficulty, so let\'s<br>start slow from \"1\"!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "だんだん解けるようになって<br>COMBOの３，４が解けるようになったら<br>ディリーチャレンジに挑戦しよう",
            en: "Once you can solve<br>COMBO level 3 or 4,<br>try the Daily Challenge!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#mode-select",
        message: {
            ja: "このボタンでMODE3とMODE4を<br>切り替えることが出来て<br>MODE3が３回でHOME<br>MODE4が４回でHOME<br>COMBO入力の問題が・・・",
            en: "Switch between MODE3<br>and MODE4 here.<br>MODE3 is 3 moves to HOME,<br>MODE4 is 4 moves to HOME,<br>and COMBO questions..."
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: ["#mode-select"]
    },
	{ 
        target: "#challenge-start",
        message: {
            ja: "STARTを押すと始まるよ",
            en: "Press START to begin!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	
	{ 
        target: "#mode-select",
        message: {
            ja: "MODE3を選んでみよう",
            en: "Let's try and choose MODE3!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: ["#mode-select"],
	check: function() {
        // テキストをトリミング（前後の空白削除）して比較
        return $("#mode-select").text().trim() === "MODE 3";
        }

    },
	{ 
        target: "#challenge-start",
        message: {
            ja: "STARTを押してみよう",
            en: "Let's press START!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: ["#challenge-start"],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p5",
        message: {
            ja: "君にはこれが解けるかな？<br>この問題で世界中のプレイヤーと<br>クリアタイムを競えるんだ",
            en: "Can you solve this?<br>Compete with players<br>all over the world<br>for the best time!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#rank",
        message: {
            ja: "RANKを押すと<br>MODE3,MODE4に対応した<br>ランキングが見られるから<br>気になったらチェックしてみてね",
            en: "Press RANK to see<br>the leaderboards<br>for MODE3 and 4.<br>Check it out anytime!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []	

    },
	{ 
        target: "#input-mode",
        message: {
            ja: "COMBOを選んで・・・",
            en: "Select COMBO and..."
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#input-mode"],
	check: function() {
        // テキストをトリミング（前後の空白削除）して比較
        return $("#input-mode").text().trim() === "COMBO";
   　　 }
},

	{ 
        target: "#tebo",
        message: {
            ja: "ここを６にして・・・",
            en: "Set this to 6 and..."
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#tebo"],
	check: function() {
        // #teboのテキストを数字に変換して、1と一致するか判定
        return parseInt($("#tebo").text()) === 6;
	}
    },
	{ 
        target: "#sebo",
        message: {
            ja: "SETを押してみて",
            en: "Try pressing SET!"
        },
        pos: { x: 0, y: 600 },
        radius: 65,
        boxWidth: 340,
        allow: ["#sebo"],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
　　 },
	{ 
        target: "#p5",
        message: {
            ja: "６回でHOMEのCOMBO入力<br>もしもこれがクリア出来たら<br>僕たちが特別なダンスを披露するね",
            en: "A 6-step HOME COMBO!<br>If you can clear this,<br>we'll perform<br>a special dance for you!"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#peek-btn",
        message: {
            ja: "一応説明するけど<br>行き詰ったらPEEK（のぞき見）を押すと<br>こっそり一つ目の答えを教えてあげる",
            en: "Just so you know,<br>if you get stuck, <br>press PEEK and I'll<br>secretly give you<br>the first answer!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: ["#peek-btn"]
    },
	{ 
        target: "#peek-btn",
        message: {
            ja: "下の方にある<br>FORBIDDEN FRUIT<br>（禁断の果実）<br>ご利用は自己責任でね",
            en: "Look down below for<br>FORBIDDEN FRUIT...<br>Use it at your own risk!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p1",
        message: {
            ja: "PEEKやFORBIDDEN FRUITを押さずに<br>COMBOの問題を解いた時に<br>クリアタイムが表示されるよ",
            en: "If you solve a COMBO puzzle<br>without using PEEK or FORBIDDEN FRUIT,<br>your clear time will be displayed!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p1",
        message: {
            ja: "あとクリップボードに<br>同じ問題に挑戦するための<br>URLが発行されるから<br>友達に挑戦状として送っても面白いかもね",
            en: "Also, a URL to challenge the exact same puzzle<br>will be copied to your clipboard.<br>It might be fun to send it to your friends<br>as a challenge code!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },

	{ 
        target: "#p1",
        message: {
            ja: "長い説明になったけど<br>聞いてくれてありがとう",
            en: "Thanks for listening<br>to my long explanation!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p1",
        message: {
            ja: "僕たち、見た目はこんな風だけど<br>パズルはけっこう難しいよ",
            en: "We might look cute,<br>but these puzzles are pretty tough!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
　　　　{ 
        target: "#p1",
        message: {
            ja: "ちょっと難しいって思ったら<br>下の方の「NUMBERS WHISPER」で<br>数字たちの内緒話が聞けるよ",
            en: "If it feels too hard,<br>check out the\"NUMBERS WHISPER\"<br>down below!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p1",
        message: {
            ja: "パズルに役立つ話が<br>聞けるかもしれないね",
            en: "You can listen to our secret chat.<br>It might help you solve the puzzle!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },	
	{ 
        target: "#p1",
        message: {
            ja: "いっぱい遊んでくれたらうれしいな<br>じゃあパズルの中で待ってるね",
            en: "I hope you have lots of fun playing!<br>See you inside the puzzle!"
        },
        pos: { x: 0, y: 250 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	

// ... 続く
];



const hintData = [
    { 
        target: "#p9",
        message: {
            ja: "おや！見ない顔だね<br>君が「１」が話してた<br>新しい友だちかな",
            en: "Oh, hello there! A new face.<br>Are you the new friend<br>that \"1\"' was telling me about?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    
	{ 
        target: "#p9",
        message: {
            ja: "私はこのパズルを研究している<br>見ての通りの「９」だよ",
            en: "I'm \"9\", as you can see,<br>and I spend my time<br>studying this puzzle."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
		{ 
        target: "#p9",
        message: {
            ja: "解き方で困ってるなら<br>私の話を聞いていけばいい<br>今よりずっと解けるようになるよ",
            en: "If you're stuck on a puzzle,<br>just listen to what I have to say.<br>You'll get much better at this!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "まずは初歩から始めよう",
            en: "Let's start<br>with the basics first."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	
	{ 
        target: "#p5",
        message: {
            ja: "これはあと１回押すとHOMEって配置",
            en: "In this layout, one more tap<br>will send it right HOME."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [1, 3, 6, 5, 2, 9, 4, 7, 8]
    },
	{
	target: "#p5",
        message: {
            ja: "これもあと１回押すとHOMEって配置",
            en: "Also, in this layout, one more tap<br>will send it right HOME too."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 5, 9, 4, 7, 8]
    },
	{
	target: "#p5",
        message: {
            ja: "これも一緒だよ<br>何かに気が付いた？",
            en: "This one is no different.<br>Notice anything yet?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 8, 5, 4, 7, 9]
    },
	{
	target: "#p5",
        message: {
            ja: "私たちがHOMEにいると<br>マスが体と同じ色になるんだけど<br>誰か一人だけHOMEにいるでしょ",
            en: "When we are HOME,<br>the tile changes to our body color.<br>See? Just one of us is HOME right now."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 8, 5, 4, 7, 9]
    },
	{
	target: "#p5",
        message: {
            ja: "押された数字は動かない！<br>私たちのルール覚えてるかい？<br>あと一回押してHOMEってことは・・・",
            en: "The number you tap won't move!<br>Remember our golden rule?<br>So, if it goes HOME in one more tap..."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 8, 5, 4, 7, 9]
    },
	{
	target: "#p5",
        message: {
            ja: "誰を押せばいいか解ったら<br>「優しく」押してみて",
            en: "If you know who to tap,<br>be sure to do it gently."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p9"],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }	
    },
	{
	target: "#p5",
        message: {
            ja: "ついでにもう一問<br>押してみて",
            en: "Here is one more for you.<br>Give it a tap!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p1"],
	boardState: [1, 3, 6, 5, 2, 9, 4, 7, 8],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
　　},
	{ 
        target: "#p9",
        message: {
            ja: "分かってくれたかな？<br>話を進めるよ",
            en: "Did you get it?<br>Let's move forward."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p7",
        message: {
            ja: "ここが「７」のHOMEだね",
            en: "This is where \"7\" belongs."
        },
        pos: { x: 0, y:500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "あと二回押してHOMEって時に・・・",
            en: "So, when it needs two more taps<br>to go HOME..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p4",
        message: {
            ja: "ここ！",
            en: "Here!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [2, 6, 9, 7, 3, 5, 1, 4, 8]	
    },
		{ 
        target: "#p1",
        message: {
            ja: "ここ！",
            en: "Here!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [7, 3, 9, 2, 6, 5, 1, 4, 8]
    },
		{ 
        target: "#p2",
        message: {
            ja: "ここ！",
            en: "Here!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [3, 7, 6, 2, 9, 5, 1, 4, 8]
    },
	{ 
        target: "#p3",
        message: {
            ja: "ここ！",
            en: "Here!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 7, 2, 5, 9, 1, 4, 8]
	   
    },
	{ 
        target: "#p6",
        message: {
            ja: "最後！ここ！",
            en: "And finally, here!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	{ 
        target: "#p9",
        message: {
            ja: "今の５か所の何処かに<br>「７」がいるだけで<br>私には答えが解るんだよ！",
            en: "Just having \"7\" in one of those<br>five spots is more than enough<br>for me to know the answer!"
        },
        pos: { x: 0, y:500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]             	
    },	
	{ 
        target: "#p9",
        message: {
            ja: "どうして解るのかって言うと<br>彼がどうやってHOMEを目指すか<br>それが判るからだよ",
            en: "How do I know, you ask?<br>Because I can see exactly how<br>he will make his way HOME."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p5",
        message: {
            ja: ".....<br>.....",
            en: ".....<br>....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "二回飛んでHOMEに行こうとすると<br>「７」はあそこを通るしかないんだよ",
            en: "To reach HOME in two jumps,<br>\"7\" has no choice but to pass<br>through that exact spot."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: ".....<br>.....<br>.....",
            en: ".....<br>.....<br>....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "もう解ったかな<br>「７」だけじゃないよ",
            en: "Do you see it now?<br>It's not just about \"7\"."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "真ん中の「５」以外は<br>同じようなマスが５つずつあるから<br>難易度２の問題はもう迷わないね",
            en: "Except for \"5\" in the center,<br>each has five similar spots.<br>So you won't get lost on Level 2!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "僕の事呼んだ？",
            en: "Did somebody call me?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "いや呼んだわけじゃないよ<br>君だけ特別って話をしてたんだ",
            en: "Oh, we didn't call you.<br>We were just saying how<br>special you are."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "特別だって？<br>そういっていつも僕を仲間外れに・・・",
            en: "Special?<br>You always use that word<br>to leave me out..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "仲間外れになんてしてないんだけどな",
            en: "Oh, come on.<br>I'm not leaving you out."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "僕は真ん中にいるから<br>みんなが良く見えるんだけど<br>１ ２ ３ ６ ９ ８ ７ ４<br>いつもこの順番で並んでるけど<br>僕だけ入る所がないじゃないか",
            en: "Since I'm in the center,<br>I can see everyone really well...<br>1 2 3 6 9 8 7 4...<br>They're always lined up like that,<br>so there's no space for me!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
　　　　{ 
        target: "#p9",
        message: {
            ja: "いや、やっぱり君は特別だよ<br>今、自分で言ったでしょ<br>みんなの事が良く見えるって<br>私からだと４ １ ２の顔は<br>よく見えないんだよ",
            en: "No, you really are special.<br>You said it yourself just now,<br>that you can see everyone well.<br>From where I am, I can't see<br>the faces of 4, 1, and 2 very well."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "みんなの顔がよく見えて<br>どこに居たって一歩でHOMEに行ける<br>とてもうらやましいよ",
            en: "You can see everyone's face,<br>and you can go HOME in just one step<br>no matter where you are.<br>I'm truly envious of you."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
　　　　{ 
        target: "#p5",
        message: {
            ja: "そ、そうなのかな<br>僕って特別なのかな<br>～♪",
            en: "R-Really?<br>Am I really that special?<br>〜♪"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
　　　　{ 
        target: "#p9",
        message: {
            ja: "「５」の機嫌も良くなったみたいだし<br>一つ重要なロジックを紹介しよう<br>このパズルの目的は<br>みんなをHOMEに導くこと・・・",
            en: "Now that \"5\" is in a better mood,<br>let me share a key piece of logic.<br>The objective of this puzzle<br>is to guide everyone HOME..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "でもそれは言い換える事が出来て<br>「１」を起点にすると・・・",
            en: "But we can phrase that differently.<br>If we take \"1\" as our starting point..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "「５」を中心にして",
            en: "...and with \"5\" at the center."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
        { 
        target: "#p1",
        message: {
            ja: "「１」！",
            en: "\"1\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p2",
        message: {
            ja: "「２」！",
            en: "\"2\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p3",
        message: {
            ja: "「３」！",
            en: "\"3\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p6",
        message: {
            ja: "「６」！",
            en: "\"6\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "「９」！",
            en: "\"9\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
        { 
        target: "#p8",
        message: {
            ja: "「８」！",
            en: "\"8\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p7",
        message: {
            ja: "「７」！",
            en: "\"7\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p4",
        message: {
            ja: "「４」！",
            en: "\"4\"!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },

	{ 
        target: "#p5",
        message: {
            ja: "５を中心にして<br>１ ２ ３ ６ ９ ８ ７ ４ と<br>時計回りに並べること<br>と言い換える事ができる",
            en: "It can be phrased as:<br>arranging 1 2 3 6 9 8 7 4<br>in a clockwise order<br>around the center \"5\"."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "入れ替わってる順番を<br>限られた回数を使って<br>どうやって並べ治すか<br>こう考えてみるんだよ",
            en: "Think of it this way:<br>how to rearrange<br>the shuffled sequence <br>with a limited number of moves."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	
	{ 
        target: "#p5",
        message: {
            ja: "「３」に目を向けてみるよ<br>これがHOMEだよね",
            en: "Let's focus on \"3\" for a moment.<br>This is its HOME, right?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },

	{ 
        target: "#p2",
        message: {
            ja: "あと１回の時・・・",
            en: "When there's 1 move left..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 5, 9, 4, 7, 8]
    },
	{ 
        target: "#p1",
        message: {
            ja: "あと２回の時・・・",
            en: "When there are 2 moves left..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 9, 2, 5, 8, 1, 4, 7]
    },
	{ 
        target: "#p4",
        message: {
            ja: "あと３回の時・・・",
            en: "When there are 3 moves left..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [6, 9, 8, 3, 5, 7, 2, 1, 4]
    },
	{ 
        target: "#p7",
        message: {
            ja: "あと４回の時・・・",
            en: "When there are 4 moves left..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [9, 8, 7, 6, 5, 4, 3, 2, 1]
    },
	{ 
        target: "#p5",
        message: {
            ja: "今見せたのが<br>それぞれのタイミングで<br>「３」がいるべき場所ってことだよ",
            en: "What I just showed you<br>is where \"3\" should be<br>at each of those moments."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },

	{ 
        target: "#p5",
        message: {
            ja: "難易度３の問題を用意したから<br>さっそく一問解いてみよう<br>最初の数字は解るかな？",
            en: "I've set up a Level 3 puzzle for you.<br>Let's try solving it right away.<br>Can you figure out the first number?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4]
    },
	{ 
        target: "#p5",
        message: {
            ja: "真ん中の数字が<br>あと２回の時にいるべき場所は<br>どこだったか覚えてる？",
            en: "Do you remember where the center number<br>should be when there are 2 moves left?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4]
    },
	{ 
        target: "#p1",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: [],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4]	
    },	
　　　　{ 
        target: "#p5",
        message: {
            ja: "思い出したら<br>どこを押したらいいか<br>考えてみよう",
            en: "Once you remember,<br>think about where to press."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4]
    },
	{ 
        target: "#p4",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: [],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4]	
    },
	{ 
        target: "#p5",
        message: {
            ja: "１つ目の数字は解ったかな<br>解ったら押してみよう<br>一回押したらNEXTを押してね",
            en: "Did you find the first number?<br>If you did, go ahead and press it.<br>Once you've pressed it, tap NEXT."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p4"],
	boardState: [6, 9, 7, 2, 3, 5, 8, 1, 4],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p5",
        message: {
            ja: "２つ目の数字は解かるかな<br>あと二回しか押せないけど<br>あの数字があんな所にいるよ<br>解るかな？",
            en: "Can you find the second number?<br>You only have two moves left.<br>Look, that number is over there!<br>Do you see it?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	{ 
        target: "#p6",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	{ 
        target: "#p5",
        message: {
            ja: "あの数字はまずあそこに行くんだよ",
            en: "That number needs to go there first."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	
{ 
        target: "#p5",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	{ 
        target: "#p5",
        message: {
            ja: "だったらどこを押せばいいのか<br>解るかな？",
            en: "So, do you know which one to press?<br>Can you figure it out?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	{ 
        target: "#p9",
        message: {
            ja: ".....",
            en: "....."
        },
        pos: { x: 100, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: [],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5]	
    },
	
　　　　{ 
        target: "#p5",
        message: {
            ja: "２つ目の数字は解ったかな<br>解ったら押してみよう<br>一回押したらNEXTを押してね",
            en: "Did you find the second number?<br>If you did, go ahead and press it.<br>Once you've pressed it, tap NEXT."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p9"],
	boardState: [3, 6, 9, 2, 8, 7, 1, 4, 5],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p5",
        message: {
            ja: "ここまで来たらあと１回<br>もう解ってるよね？<br>さあ押してみよう",
            en: "Just one more move to go!<br>I'm sure you already know the answer.<br>Go ahead and press it!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p8"],
	boardState: [2, 3, 6, 1, 7, 9, 4, 8, 5],
	check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
	
    },
	{ 
        target: "#p9",
        message: {
            ja: "どうかな？<br>何となく解ってもらえたかな？",
            en: "How did it go?<br>Did you get the hang of it?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]	
    },
	{ 
        target: "#p8",
        message: {
            ja: "何となくなら解るんだよな",
            en: "Yeah, I get the general idea."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "急にどうしたんだい「８」",
            en: "Whoa, where did that come from, \"8\"?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p8",
        message: {
            ja: "ちょっと話が聞こえてな<br>俺もたまには解こうって思うんだけど<br>俺たち９人もいるだろ！",
            en: "I just happened to overhear you.<br>I actually want to solve it sometimes,<br>but come on, there are nine of us!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },

	{ 
        target: "#p8",
        message: {
            ja: "誰を押せばいいんだって<br>多いから迷うんだよな",
            en: "Like, \"Who the heck do I press?\"<br>There are too many, I get lost."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p8",
        message: {
            ja: "なんかもっとズバッと<br>こいつが怪しい！ってのは無いのか？",
            en: "Isn't there a quicker way, like,<br>\"Yeah, this is the shady one!\"?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "そうか・・・<br>だったらこんな方法を試してみるかい？",
            en: "I see...<br>Then why not try this approach?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p8",
        message: {
            ja: "なんかいい方法があるんなら<br>是非とも聞かせてくれ",
            en: "If you've got a good trick,<br>I'm all ears. Let's hear it!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "先ほど話題にした<br>それぞれの数字が<br>どのタイミングで<br>どこに居るべきかという話<br>それを詳しく話そう",
            en: "Remember what we said?<br>Let's dive into exactly where<br>each number should be, and when."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },

	{ 
        target: "#p5",
        message: {
            ja: "これは難易度３の問題なんだけど<br>難易度の回数３回<br>真ん中の私を押してみて",
            en: "This is a Level 3 puzzle.<br>That means we press 3 times.<br>Go ahead and tap me in the center!"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p5"],
	boardState: [3, 6, 8, 2, 9, 7, 5, 1, 4],
		check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },	
	{ 
        target: "#p5",
        message: {
            ja: "いくつかの数字たちが<br>HOMEにいるのがわかるよね",
            en: "You can see that some of the numbers<br>are already back in their HOME, right?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [1, 5, 2, 4, 9, 3, 7, 8, 6]	
    },
	{ 
        target: "#p1",
        message: {
            ja: "１",
            en: "1"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },	
	{ 
        target: "#p4",
        message: {
            ja: "４",
            en: "4"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p7",
        message: {
            ja: "７",
            en: "7"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p8",
        message: {
            ja: "８",
            en: "8"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },	
	{ 
        target: "#p5",
        message: {
            ja: "今、HOMEにいる４人は<br>何となく飛んでれば<br>HOMEに辿り着く",
            en: "Right now, those four at HOME<br>will just naturally drift back<br>into their places with a bit of luck."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p5",
        message: {
            ja: "つまり、この問題のカギは<br>今HOMEに居ない・・・",
            en: "In other words, the key to this puzzle<br>lies with those who aren't HOME yet..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p2",
        message: {
            ja: "５",
            en: "5"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p3",
        message: {
            ja: "２",
            en: "2"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	
　　　　{ 
        target: "#p5",
        message: {
            ja: "９",
            en: "9"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p6",
        message: {
            ja: "３",
            en: "3"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "６",
            en: "6"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p5",
        message: {
            ja: "この５つの数字が<br>問題を解くカギになる<br>こう考えれば<br>候補を５つに減らすことが出来るんだ",
            en: "These 5 numbers hold the key<br>to solving the whole thing.<br>Look at it this way, and we can<br>narrow the suspects down to just 5!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p8",
        message: {
            ja: "すごいな！<br>これなら解りそうだ<br>続きはどうするんだ",
            en: "That's awesome!<br>Now it actually makes sense.<br>So, what's our next move?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []	
    },
	{ 
        target: "#p5",
        message: {
            ja: "更にさっき私を３回押した時・・・",
            en: "Furthermore, when you pressed me<br>3 times just a moment ago..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p3",
        message: {
            ja: "２",
            en: "2"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p6",
        message: {
            ja: "３",
            en: "3"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p9",
        message: {
            ja: "６",
            en: "6"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 150,
        allow: []	
    },
	{ 
        target: "#p5",
        message: {
            ja: "この３人が<br>HOMEを通り過ぎたことに<br>気が付いたかい？",
            en: "Did you notice that<br>these 3 numbers have already<br>passed right through their HOME?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "この３人は一回立ち止まっていれば<br>HOMEに居られたのかもしれない<br>もし一回押していれば・・・",
            en: "These 3 numbers might have stayed<br>at HOME if they had stopped once.<br>If only you had pressed them once..."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "じゃあさっそく解いてみよう<br>真ん中の私は誰と誰の間に行けばいいと思う",
            en: "Now, let's solve it right away.<br>Between which two numbers<br>do you think I in the center should go?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 8, 2, 9, 7, 5, 1, 4]
    },	
	{ 
        target: "#p5",
        message: {
            ja: "１２３６９８７４・・・",
            en: "1 2 3 6 9 8 7 4 ..."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },	
	{ 
        target: "#p5",
        message: {
            ja: "解ったら<br>そこに行くための数字を押してくれる<br>一回押したらNEXTを押してね",
            en: "Once you figure it out,<br>please press the number to get me there.<br>Once you've pressed it, tap NEXT."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p2"],
	boardState: [3, 6, 8, 2, 9, 7, 5, 1, 4],
		check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },	
	{ 
        target: "#p5",
        message: {
            ja: "次は「３」が真ん中にいるけど<br>あの数字の順番から考えれば<br>解るよね？",
            en: "Next, \"3\" is in the center, but<br>if you think of the number order,<br>you can easily figure it out, right?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 6, 9, 5, 3, 8, 1, 4, 7]
	
    },
	{ 
        target: "#p5",
        message: {
            ja: "さあ、押してみよう！<br>一回押したらNEXTを押してね",
            en: "Now, go ahead and press it!<br>Once you've pressed it, tap NEXT."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p1"],
	boardState: [2, 6, 9, 5, 3, 8, 1, 4, 7],
		check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p5",
        message: {
            ja: "よく私たちの並びを見てみて",
            en: "Take a close look <br>at how we are arranged."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [2, 3, 6, 1, 5, 9, 4, 7, 8]
    },
	{ 
        target: "#p5",
        message: {
            ja: "HOMEにいる「５」を中心に<br>１２３６９８７４・・・<br>あの並びが完成してるよね",
            en: "Centered around \"5\" at HOME,<br>1, 2, 3, 6, 9, 8, 7, 4...<br>that sequence is complete, right?"
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "もう押すのはあの数字だよ<br>一回押したらNEXTを押してね",
            en: "Now, the number to press is that one.<br>Once you've pressed it, tap NEXT."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: ["#p5"],
	boardState: [2, 3, 6, 1, 5, 9, 4, 7, 8],
		check: function() {
          if (!hasPressedTarget) {
             return false; 
          }
          return true; // 押されていれば NEXT を許可
        }
    },
	{ 
        target: "#p9",
        message: {
            ja: "どうかな？<br>解き方は解ってきたかな？",
            en: "How about it?<br>Are you starting to see how to solve it?"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p8",
        message: {
            ja: "何だか解ってきた気がするな",
            en: "I feel like I'm starting to get it now."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p9",
        message: {
            ja: "みんなが解けるようになって<br>パズルを楽しんでくれたら<br>私もうれしいよ",
            en: "If everyone can solve it <br>and enjoy the puzzle,<br>I'll be happy too."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "ちなみにさっきのこの問題<br>答えは数字を６２５と押したけど<br>いくつか別解が存在する",
            en: "By the way, for this puzzle just now, <br>we tapped the numbers 6, 2, and 5,<br>but there are several other solutions."
        },
        pos: { x: 0, y: 500 },
        radius: 180,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 8, 2, 9, 7, 5, 1, 4]
    },
	{ 
        target: "#p5",
        message: {
            ja: "面白そうだから<br>もっとそれについて<br>研究しようと思ってるよ",
            en: "Since it looks so interesting,<br>I'm thinking of exploring<br>more about it."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [3, 6, 8, 2, 9, 7, 5, 1, 4]
    },
	{ 
        target: "#p9",
        message: {
            ja: "せっかく話を聞いてくれたんだ<br>ここでの話は少し内緒にして<br>誰かと早解き勝負でもしてみたら？",
            en: "Since you've been such a great listener,<br>keep what we discussed a little secret<br>and challenge someone to a speed-solve!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: [],
	boardState: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
	{ 
        target: "#p9",
        message: {
            ja: "きっと勝てると思うよ",
            en: "I'm sure you can win!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },	
{ 
        target: "#p9",
        message: {
            ja: "そしたらここでの話を伝えてほしい<br>私の望みはより多くの人に<br>このパズルを楽しんでもらうことだから",
            en: "If you do, please share this secret,<br>because my wish is for more people<br>to enjoy this puzzle."
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
	{
	target: "#p9",
        message: {
            ja: "話はここまでかな<br>じゃあ次はパズルのなかで<br>いっしょに頭を回そうじゃないか！",
            en: "That's all for our chat, I guess.<br>So next, inside the puzzle,<br>let's spin our gears together!"
        },
        pos: { x: 0, y: 500 },
        radius: 65,
        boxWidth: 340,
        allow: []
    },
{ 
        target: "#p5",
        message: {
            ja: "数字たち「いっぱい遊んでね」",
            en: "Numbers said,\"Play with us a lot!\""
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	{ 
        target: "#p5",
        message: {
            ja: "本アプリでは以下の素材を使用しています<br>「しゅわしゅわハニーレモン・・・350ml」<br>作曲：しゃろう (@shlllllw)<br>https://x.com/shlllllw",
            en: "This app uses the following assets:<br>\"Shuwashuwa Honey Lemon... 350ml\"<br>(Fizzy Honey Lemon Soda)<br>Composed by Sharou (@shlllllw)<br>https://x.com/shlllllw"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },
	
{ 
        target: "#p5",
        message: {
            ja: "数字キャラクターイラスト<br>IllustCute（DESIGNALIKIE）<br>https://illustcute.com/",
            en: "Number Character Illustrations<br>by IllustCute (DESIGNALIKIE)<br>https://illustcute.com/"
        },
        pos: { x: 0, y: 600 },
        radius: 180,
        boxWidth: 340,
        allow: []
    },


	

// ... 続く
];



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
	//updateHyouji("✨ HOME ✨", "success");

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


function applyTutorialStyle(step) {
  // 1. 輪っかとガイドの大きさを変更
  gsap.to("#guide-circle, #guide-ring", {
    attr: { r: step.radius },
    duration: 0.5,
    ease: "back.out(1.7)" // 少し弾むような演出
  });

  // 2. メッセージボックスの幅を変更
  gsap.to("#tutorial-msg-box", {
    width: step.boxWidth,
    duration: 0.3
  });
}

function setupTutorialState() {
    // 1. モードと歩数のリセット
    isComboMode = false;
	modeMoves = 0;
    selectedSteps = 0;
    inputBuffer = [];
    $("#input-mode").text("SINGLE").removeClass("mode-active");
    $("#tebo").text("0");

    // 2. 盤面を初期状態（1〜9）に戻す
    panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    panelState.forEach((n, i) => posMap[n - 1] = i);
    refreshPanels();

    // 3. サウンドを強制的にONにする
    isSoundOn = true;
    $(".sys-sound").css("opacity", "1.0");

    // 4. 表示のリセット
   // updateHyouji("TUTORIAL", "default");

    // 5. 特殊状態の解除（ダンス中やアニメーション中なら停止）
    if (isDancing) abortDance();
    isAnimating = false;
}

/**
 * チュートリアルステップを表示する（整理・統合版 ＋ 盤面強制配置）
 */
function showTutorialStep(tutorialStep) {

    // 1. 押されたボタンの type に応じてデータ配列を完全に切り替え
    const step = (tutorialType === "hint") 
        ? hintData[tutorialStep] 
        : tutorialData[tutorialStep];
    if (!step) return;
if (typeof step.onStepStart === "function") {
    step.onStepStart();
}
	

    // 🌟 【新機能】盤面の強制配置（boardState）の処理
    // ステップデータ内に boardState が存在する場合のみ実行
    if (step.boardState && Array.isArray(step.boardState)) {
        // 配列の値を受け渡し（値コピー）
        panelState = [...step.boardState];
        
        // 盤面を再描画（一瞬で切り替える場合は false、プルプル弾ませたい場合は true）
        refreshPanels();
    }
	
    hasPressedTarget = false;

    // 言語に応じたメッセージの取得
    const messageText = step.message[currentLang] || step.message['ja'];

    // 2. ターゲット要素の座標取得（#content基準）
    const $target = $(step.target);
    const targetPos = $target.position(); // 親要素からの相対位置
    const targetWidth = $target.outerWidth();
    const targetHeight = $target.outerHeight();

    const cx = targetPos.left + targetWidth / 2;
    const cy = targetPos.top + targetHeight / 2;

    // 3. 演出：ガイド（輪っか）の移動と変形
    $("#tutorial-guide-layer").show();
    $("#guide-ring").show();

    gsap.to("#guide-circle, #guide-ring", {
        attr: { 
            cx: cx, 
            cy: cy, 
            r: step.radius || 60 
        },
        duration: 0.5,
        ease: "back.out(1.7)"
    });

    // 4. 演出：メッセージボックスの更新と移動
    $("#tutorial-msg-text").html(messageText);
    $("#tutorial-msg-box").show();

    gsap.to("#tutorial-msg-box", {
        left: step.pos.x,
        top: step.pos.y,
        width: step.boxWidth || 240,
        duration: 0.4,
        ease: "power2.out"
    });

    // 5. 操作制限の適用
    setTutorialLock(step.allow); //kkkkkk
}
// チュートリアル用の操作制限関数
function setTutorialLock(allowList) {
    // 1. まず全ての操作（パネル、ボタン、アイコン）を無効化
    $(".panel, .bot,#tebo, .icon-btn").css("pointer-events", "none").css("cursor", "default");

    // 2. 許可リスト(allowList)にある要素だけを有効化
    if (allowList && allowList.length > 0) {
        allowList.forEach(selector => {
            $(selector).css("pointer-events", "auto").css("cursor", "pointer");
        });
    }

    // 3. チュートリアル自身の操作ボタン（NEXTや言語選択）は常に許可
    $("#tutorial-next-btn, #lang-jp, #lang-en").css("pointer-events", "auto").css("cursor", "pointer");
}

// チュートリアル終了時に全てを元に戻す関数
function unlockAll() {
    $(".panel, .bot,#tebo, .icon-btn").css("pointer-events", "auto").css("cursor", "pointer");
}

function startInteractiveTutorial() {
    tutorialStep = 0; // 0にリセット
    setupTutorialState(); // 盤面リセット
    
    // シンプルに「0番目をお願い！」とだけ頼む
    showTutorialStep(tutorialStep);
}

function clearTutorialArrows() {
    $(".tutorial-arrow").remove();
}

/**
 * ４．タッチされた場所に従って、角度を合わせた矢印を表示する関数（サイズ1/3縮小版）
 * @param {number} clickedIdx - タップされたパネルのインデックス (0 〜 8)
 */
function displayTutorialArrows(clickedIdx) {
    // 該当するインデックスの矢印設定を取得
    const arrowConfig = TUTORIAL_ARROW_MAP[clickedIdx];
    if (!arrowConfig || arrowConfig.length === 0) return;

    // 基準となるパズルグリッドのエレメントと位置を取得
    const $grid = $(".puzzle-grid");
    if ($grid.length === 0) return;
    
    const gridOffset = $grid.offset(); // 画面全体に対するグリッドの絶対座標（左上）

    // 8本の矢印を動的に生成して配置
    arrowConfig.forEach(cfg => {
        const coords = ARROW_POSITIONS[cfg.posIdx];
        if (!coords) return;

        // body直下に絶対配置で浮かせる<img>を生成
        const $arrow = $("<img>", {
            src: "img/yajirusi.png", // 透過矢印画像
            class: "tutorial-arrow", // 消去時のセレクタ用クラス
            css: {
                position: "absolute",
                // 🌟 【サイズ変更】元の画像の幅を3分の1（約33%）に制限します
                // ※もしこれでも大きすぎる場合は、"24px" や "30px" のように固定ピクセル指定も可能です
                width: "60%", 
                maxWidth: "60px", // 10pxの隙間に合わせるための最大幅の目安（調整可能）
//width: "clamp(36px, 11vw, 62px)",


                // グリッドの左上座標を基準に、計算された相対座標を足す
                left: (gridOffset.left + coords.x) + "px",
                top: (gridOffset.top + coords.y) + "px",

// left: pos.x + "%",
// top:  pos.y + "%",               
                // 🌟 画像自体の中心（50% 50%）を基準にして、その場で回転させる
                transform: "translate(-50%, -50%) rotate(" + cfg.angle + "deg)",
                transformOrigin: "center center",

                zIndex: 1000,          // パネルよりも確実に手前に出す
                pointerEvents: "none", // 矢印自体が背後のパネルクリックを邪魔しないようにガード
                display: "none"        // アニメーション用に最初は非表示
            }
        });

        // 画面に追加してフェードイン
        $("body").append($arrow);
        $arrow.fadeIn(100);
    });
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

    const currentMode = dailyTargetSteps; // 今のモード（3 or 4）を確認

    isComboMode = true; 
    isChallengeMode = true;
    selectedSteps = currentMode; 
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

        // --- ここが修正ポイント ---
        // すでにこのモードの計測が始まっている場合は、startTime を上書きしない
        if (!isTimerActive[currentMode]) {
            startTime = performance.now();
            isTimerActive[currentMode] = true; // 計測開始フラグを立てる
            console.log(`Mode ${currentMode} 計測開始!`);
        } else {
            console.log(`Mode ${currentMode} はすでに計測中なので時間を維持します。`);
        }
        // ------------------------
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
    // 1. まずはフラグをリセット（忘却防止）
    if (typeof isTimerActive !== 'undefined') {
        isTimerActive[selectedSteps] = false;
    }

    // 2. 【重要】タイムを画面中央（表示エリア）に出す！
    // 以前の updateHyouji ロジックに従って「TIME: 12.34s」のように表示します
    const timeDisplay = parseFloat(clearTime).toFixed(2) + "s";
    updateHyouji("TIME: " + timeDisplay, "network");

    // 3. 通信は「投げっぱなし」にする（await を外す）
    // これにより、送信完了を待たずに即座にランキングが開きます
    sendLog("postScore", selectedSteps, { time: parseFloat(clearTime), appType: "POP" });

    // 4. ランキング画面を即座に表示
    openGlobalRank(); 
    
    // 5. 少し遅れて最新のランキングデータを読み込む
    setTimeout(() => { 
        showGlobalRank(selectedSteps, 0); 
    }, 800);
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

	if (isComboTiming) {
        isComboTiming = false; // 計測終了

        // カンニングしていない場合のみ挑戦状を発行！
        if (!usedCheatFlag) {
            let comboEndTime = performance.now();
            let clearTime = ((comboEndTime - comboStartTime) / 1000).toFixed(2);
            
            // SETした瞬間の9桁の盤面文字列（例: savedState.join("") など）
            let boardStr = savedState.join(""); 
            
            // 挑戦状発行！
            generateChallengeOrResponse(selectedSteps, boardStr, clearTime);
	updateHyouji(`${clearTime}s `, "default");

	// =========================================================
    isFromChallenge = false;
    challengeOriginalTime = null;
    // =========================================================
        }
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
        refreshPanelsExt("normal");
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
        changeRankDay(0, dailyTargetSteps);
    }

    window.changeRankDay = function(offset, forcedSteps = null) {
        currentDayOffset = offset;
        let steps = (forcedSteps !== null) ? forcedSteps : dailyTargetSteps;
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

	// --- 2. 共通の開始処理 ---
function openTutorialSelector(type) {
    if (isAnimating) return;
    tutorialType = type; // ここで「どっちのボタンから来たか」を記録！

    if (isSoundOn) playSnd('click');
    if (isDancing) abortDance();

    // 盤面を綺麗にして、言語選択を表示
    refreshPanelsExt("normal");
    $("#tutorial-overlay").css("display", "flex").hide().fadeIn(200);
}

// 🌟 【世界進出・短文化ローカライズ版】挑戦状・勝敗結果生成関数
function generateChallengeOrResponse(moves, boardStr, myTime) {
    const basePageUrl = window.location.origin + window.location.pathname;
    let outputText = "";

    // 言語変数のチェック（未定義なら 'ja' をデフォルトに）
    const lang = (typeof currentLang !== "undefined") ? currentLang : "ja"; 

    if (isFromChallenge && challengeOriginalTime !== null) {
        // =========================================================
        // 【A: 誰かの挑戦状に挑んでクリアした場合】
        // =========================================================
        const diff = (challengeOriginalTime - parseFloat(myTime)).toFixed(2);
        let resultLine = "";
        let bestTime = challengeOriginalTime;

        if (parseFloat(myTime) < challengeOriginalTime) {
            bestTime = parseFloat(myTime); 
            resultLine = (lang === "ja") 
                ? `あなたの勝ち！（相手より ${diff}秒 早い！）`
                : `You Win! (${diff}s faster!)`;
        } else if (parseFloat(myTime) > challengeOriginalTime) {
            bestTime = challengeOriginalTime;
            resultLine = (lang === "ja")
                ? `残念！（相手より ${Math.abs(diff)}秒 遅い…）`
                : `You Lose... (${Math.abs(diff)}s slower...)`;
        } else {
            bestTime = challengeOriginalTime;
            resultLine = (lang === "ja") ? `奇跡！` : `Miracle!`;
        }

        const responseChallengeUrl = `${basePageUrl}?m=combo&d=${moves}&b=${boardStr}&t=${bestTime}`;

        if (lang === "ja") {
            outputText = 
`【Cyclogic 挑戦状・対戦結果】
難易度: ${moves}手 の勝負！
盤面: [${boardStr}]

目標タイム: ${challengeOriginalTime}秒
記録: ${myTime}秒

結果 ⇒ ${resultLine}

参戦してみる？【最速記録：${bestTime}秒】
${responseChallengeUrl}`;
        } else {
            outputText = 
`【Cyclogic Challenge Result】
Difficulty: ${moves} steps / First-take
Board: [${boardStr}]

Target: ${challengeOriginalTime}s
Record: ${myTime}s

Result => ${resultLine}

Want to join? [Best Record: ${bestTime}s]
${responseChallengeUrl}`;
        }

    } else {
        // =========================================================
        // 【B: 自分で通常COMBOをクリアして、新しく最初の挑戦状を発行する場合】
        // =========================================================
        const challengeUrl = `${basePageUrl}?m=combo&d=${moves}&b=${boardStr}&t=${myTime}`;
        
        if (lang === "ja") {
            outputText = 
`【Cyclogicからの挑戦状】
（難易度: ${moves}手）をクリア！
盤面: [${boardStr}]
タイム: ${myTime}秒

この記録を越せるかい！？
ここから勝負！
${challengeUrl}`;
        } else {
            outputText = 
`【Challenge from Cyclogic】
Cleared! (Difficulty: ${moves} steps)
Board: [${boardStr}]
Time: ${myTime}s

Can you beat this record?!
Smash your attempt here!
${challengeUrl}`;
        }
    }

    // クリップボードへの書き込みを実行
    navigator.clipboard.writeText(outputText)
        .then(() => {
            console.log(`クリップボードへのコピーが成功しました！ (${lang})`);
        })
        .catch(err => console.error("コピー失敗: ", err));
}
//  URLパラメータを解析して挑戦状盤面をセットアップする関数
function checkChallengeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('m');
    const digits = urlParams.get('b');
    const steps = urlParams.get('d');
    const originalTime = urlParams.get('t');

    // パラメータが揃っている、かつCOMBOモードである場合
    if (mode === 'combo' && digits && digits.length === 9 && steps) {
        isComboMode = true;
        isFromChallenge = true;
        selectedSteps = parseInt(steps, 10);
        challengeOriginalTime = parseFloat(originalTime);

        // 9桁の文字列から盤面（panelState）を復元
        panelState = digits.split('').map(Number);
        panelState.forEach((n, i) => posMap[n - 1] = i);

        // 別解に対応するため、答えの手順配列は空にする（盤面の一致のみでクリア判定するため）
        currentAnswer = []; 

        // UI表示をコンボモード・指定手数に強制書き換え
        updateUIState(false);
        updateHyouji("- ".repeat(selectedSteps).trim(), "ready");
        $("#input-mode").text("COMBO").addClass("mode-active");
        $("#tebo").text(selectedSteps);
	modeMoves = selectedSteps;

        // RESETボタン等でこの初期盤面に戻れるよう、savedStateにも記憶
        savedState = [...panelState];
        savedAnswer = [...currentAnswer];
        savedSelectedSteps = selectedSteps;
        savedIsComboMode = isComboMode;

        // 盤面描画のリフレッシュ
        refreshPanelsExt("normal");

        // 💡 【重要】画面が出現した瞬間からタイマーを即座に始動！
        comboStartTime = performance.now();
        usedCheatFlag = false;
        isComboTiming = true;

        console.log(`【挑戦状ロード成功】目標タイム: ${challengeOriginalTime}秒`);
    }
}	
    // --- イベント登録 ---
// NEXTボタンをクリックした時の挙動
$(document).on("click", "#tutorial-next-btn", function() {
    if (isSoundOn) playSnd('click');



    // ★【修正】現在どちらのモードかによって、参照する配列そのものを切り替える
    const currentDataArray = (tutorialType === "hint") ? hintData : tutorialData;

	// 現在のステップのデータを取得（切り替えた配列から取得）
    const currentStepData = currentDataArray[tutorialStep];

    // --- 【追加】条件チェックのロジック ---
    if (currentStepData && typeof currentStepData.check === "function") {
        if (!currentStepData.check()) {
            // 条件を満たしていない場合は、次へ進まずに「警告」を出す
            console.log("まだ条件を満たしていません");
            
            // 演出：メッセージボックスをガタガタ揺らして「ダメだよ」と伝える
            gsap.to("#tutorial-msg-box", {
                x: "+=10",
                yoyo: true,
                repeat: 5,
                duration: 0.05,
                onComplete: () => {
                    // 揺れ終わったら元の位置（x座標）に戻す
                    // step.pos.x がある場合はそれ、なければ現在の位置で固定
                    gsap.set("#tutorial-msg-box", { x: currentStepData.pos.x });
                }
            });
            
            // ここで処理を終了（tutorialStep++ させない）
            return;
        }
    }
    // ------------------------------------

		// 合格、または check がない場合は次のステップへ
    tutorialStep++;

    // 合格、または check がない場合は次のステップへ
    // ★【修正】終了判定の基準も、切り替えた配列の長さ（length）に合わせる
    if (tutorialStep < currentDataArray.length) {
        showTutorialStep(tutorialStep);
    } else {
        // 全ての説明が終わった場合
        $("#tutorial-msg-box, #tutorial-guide-layer").fadeOut(300);
        updateHyouji("Let's Try", "default");
    
   
        
        // 全てのロックを解除
        unlockAll(); // 以前作った一括解除関数を使うとスッキリします
    }
});
// --- チュートリアルボタンの制御 ---
$("#start-tutorial").on("click", function() {
    if (isDancing || isAnimating) return;
    if (isSoundOn) playSnd('click');
    
    openTutorialSelector("basic");

    });

$('#how-to-btn').click(function() {
    if (isDancing || isAnimating) return;
    if (isSoundOn) playSnd('click');
    
    openTutorialSelector("hint");
        
});

// --- 言語選択ボタンの制御 ---
$(".lang-btn").on("click", function() {
    currentLang = $(this).data("lang"); // 'ja' か 'en' を取得
    if (isSoundOn) playSnd('set');
    
    // モーダルを閉じてチュートリアルへ
    $("#tutorial-overlay").fadeOut(200, function() {
        startInteractiveTutorial();
    });
});



    $('.bot').click(function() {
	if (isDancing) {
        abortDance();
    }

        if (isAnimating) return;
        playSnd('click');
	if (isFromChallenge) {
        isFromChallenge = false;
        challengeOriginalTime = null;       
        
    }

        const id = $(this).attr("id");

        if (id === "mode-select") {
            dailyTargetSteps = (dailyTargetSteps === 3) ? 4 : 3; 
            $(this).text("MODE " + dailyTargetSteps);
            panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            panelState.forEach((n, i) => posMap[n - 1] = i);
            currentAnswer = [];
            updateUIState(false);
            updateHyouji("READY?", "default");
            refreshPanelsExt("normal");
        } 
        else if (id === "challenge-start") { 
	if (isAnimating) return;
	hasPressedTarget = true;
    if (isLocked) unlockSystem(); 
	refreshPanelsExt("normal");
	startChallengeProcess(); 
	}
        else if (id === "rank") {
	hasPressedTarget = true; 
	openGlobalRank(); 
	}
    });

    $('.panel').on('click', function() {

	hasPressedTarget = true;
        // 1. ガード：アニメーション中、またはクリア後のロック中は一切の入力を受け付けない
        if (isAnimating || isLocked) return; 

        const idx = $(".panel").index(this);

	// 🌟 【ここを追加！】チュートリアルの矢印実験フラグが立っている場合
    if (isArrowExperimentMode) {
	
        clearTutorialArrows(); 
	playSnd('click');     // ３．まず古い矢印を消す
        displayTutorialArrows(idx);   // ４．タッチされたインデックス(0~8)に応じた場所に矢印を表示する
        return;                      // 💡 ここで処理を終了し、以下の通常移動（COMBO/SINGLE）を完全にスキップ！
    }

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

	if (isFromChallenge) {
        isFromChallenge = false;
        challengeOriginalTime = null;       
        
    }
        isComboMode = !isComboMode;
        $(this).text(isComboMode ? "COMBO" : "SINGLE").toggleClass("mode-active", isComboMode);
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        currentAnswer = [];
        updateUIState(false);
        inputBuffer = [];
        updateHyouji(isComboMode ? (selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "SET MOVES!") : "HOME", "default");
        refreshPanelsExt("normal");
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
	if (isFromChallenge) {
        isFromChallenge = false;
        challengeOriginalTime = null;       
        
    }

        modeMoves = (modeMoves + 1) % 7;
        $(this).text(modeMoves);
        selectedSteps = modeMoves; 
        panelState = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        panelState.forEach((n, i) => posMap[n - 1] = i);
        currentAnswer = [];
        updateUIState(false);
        inputBuffer = [];
        updateHyouji(isComboMode && selectedSteps > 0 ? "- ".repeat(selectedSteps).trim() : "HOME", "default");
        refreshPanelsExt("normal");
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
	if (isFromChallenge) {
        isFromChallenge = false;
        challengeOriginalTime = null;        
        
    }
	hasPressedTarget = true;
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

	if (isComboMode && selectedSteps > 0) { 
        comboStartTime = performance.now(); // タイマー始動！
        usedCheatFlag = false;               // カンニングフラグをリセット
        isComboTiming = true;                // 計測中フラグをON
    } else {
        // COMBOモードではない、または手数0（HOME状態）ならタイマーは動かさない
        isComboTiming = false;
    }
        refreshPanelsExt("normal");
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
            refreshPanelsExt("normal");
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
	if (isComboMode && isComboTiming) {
        usedCheatFlag = true;
        // 💡 必要に応じて、タイマー表示用の要素のテキストを "NO TIME" に書き換えてください
        // $("#timer-display").text("NO TIME"); 
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
	if (isComboMode && isComboTiming) {
        usedCheatFlag = true;
        // 💡 必要に応じて、タイマー表示用の要素のテキストを "NO TIME" に書き換えてください
        // $("#timer-display").text("NO TIME"); 
    }
        if (currentAnswer.length === 0 || isAnimating) return;
        $(this).text(currentAnswer.join(" - "));
        setTimeout(() => { $(this).text("Forbidden fruit"); }, 3000);
    });

    refreshPanelsExt("normal");

	checkChallengeURL();
});