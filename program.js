// ==========================================
// 1. 変数・定数定義
// ==========================================

// ★ここに追加！コピーした本物のURLを "" の中に入れてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzw0Ut3NvGApLMZNZwAXL6yFeSFGbb1rYmbId0_tlvYvzuHseeq0l_7V6ZjHfLPsabm/exec";

var n1, n2, n3, n4, n5, n6, n7, n8, n9;
var sn1, sn2, sn3, sn4, sn5, sn6, sn7, sn8, sn9, stes;
var mov, flinput;
var isAnimating = false; 
var saveKotae = "none"; // 【追加】答えを保存する変数

var tempSn = Array(10).fill(""); // チャレンジ問題の一次保存用
let selectedSteps = 3; 
let isC3Mode = false; 
let inputBuffer = ""; 
let startTime = 0;

const pos = {
  1: {x: 0,   y: 0},   2: {x: 103, y: 0},   3: {x: 206, y: 0},
  4: {x: 0,   y: 103}, 5: {x: 103, y: 103}, 6: {x: 206, y: 103},
  7: {x: 0,   y: 206}, 8: {x: 103, y: 206}, 9: {x: 206, y: 206}
};

var challengeTimer = null; // 【追加】チャレンジ開始の遅延用


// 彗星エフェクト用
let cometDelayTimer = null;
let cometInterval = null;

// 各パネルを中心にした8マスの回転順序（時計回り）
const cometPaths = {
  "p1": [5, 2, 3, 6, 9, 8, 7, 4],
  "p2": [5, 3, 6, 9, 8, 7, 4, 1],
  "p3": [5, 6, 9, 8, 7, 4, 1, 2],
  "p4": [5, 1, 2, 3, 6, 9, 8, 7],
  "p5": [2, 3, 6, 9, 8, 7, 4, 1],  // センターは外周回転
  "p6": [5, 9, 8, 7, 4, 1, 2, 3],
  "p7": [5, 4, 1, 2, 3, 6, 9, 8],
  "p8": [5, 7, 4, 1, 2, 3, 6, 9],
  "p9": [5, 8, 7, 4, 1, 2, 3, 6]
};

// ==========================================
// 2. 音声再生
// ==========================================
function playClickSound() {
    const s = document.getElementById("sound-click");
    if (s) { s.currentTime = 0; s.play().catch(e => {}); }
}

function playCompleteSound() {
    const s = document.getElementById("sound-complete");
    if (s) { s.currentTime = 0; s.play().catch(e => {}); }
}

function playChallengeVoice(steps) {
    const s = document.getElementById("sound-ch" + steps);
    if (s) { s.currentTime = 0; s.play().catch(e => playCompleteSound()); } 
    else { playCompleteSound(); }
}

// ==========================================
// 3. メイン処理
// ==========================================
function main() { 
    // 【初期化】起動時のHOME状態を最初のセーブポイントとして刻む
    set0(false);
    $("#tebo").html("0");
    wmem(); 
// 数字パネルのホバー/タッチ開始
$('.panel').on('mouseenter touchstart', function(e) {
  if (isAnimating || isC3Mode || $("#flinput").text() === "1") return;

  const id = $(this).attr("id");

  if (cometDelayTimer) clearTimeout(cometDelayTimer);

  cometDelayTimer = setTimeout(() => {
    if (!isAnimating && !isC3Mode && $("#flinput").text() === "0") {
      startCometLoop(id);
    }
  }, 800); // 0.8秒で発火（好みで1000でも）
});

// ホバーアウト / タッチ終了
$('.panel').on('mouseleave touchend touchcancel', function(e) {
  if (cometDelayTimer) {
    clearTimeout(cometDelayTimer);
    cometDelayTimer = null;
  }
  stopCometLoop();
});

   
    // 数字パネルのクリック処理
$('.panel').click(async function() {
    stopCometLoop();           // 彗星エフェクトを即停止
    if (isAnimating) return;   // アニメ中は無視

    const flinputVal = $("#flinput").text();
    const clickedNum = $(this).text();   // クリックしたパネルの数字（チャレンジ用）

    // ────────────────────────────────────────────────
    // 1. インプットモード（flinput === "1"）
    // ────────────────────────────────────────────────
    if (flinputVal === "1") {
        playClickSound();
        const currentVal = parseInt(clickedNum);
        $(this).html((currentVal % 9) + 1);   // 1→2→…→9→1 のループ
        return;   // ここで終了 → 手数は絶対増やさない
    }

    // ────────────────────────────────────────────────
    // 2. チャレンジモード（isC3Mode === true）
    // ────────────────────────────────────────────────
    if (isC3Mode) {
        // チャレンジ中は「数字の一括入力」のみ許可
        // 実際のスライド（pm関数）は後でまとめて実行
        if (flinputVal === "0") {
            playClickSound();
            inputBuffer += clickedNum;
            $("#hyouji").text(inputBuffer.padEnd(selectedSteps, "-"));

            if (inputBuffer.length === selectedSteps) {
                isAnimating = true;
                const commands = [...inputBuffer];
                inputBuffer = "";

                for (let cmd of commands) {
                    let targetId = "";
                    for (let i = 1; i <= 9; i++) {
                        if ($("#p" + i).text() === cmd) {
                            targetId = i;
                            break;
                        }
                    }
                    if (targetId) {
                        window["pm" + targetId](false);
                        await new Promise(r => setTimeout(r, 700));
                    }
                }

                isAnimating = false;
                hantei(true);
            }
        }
        return;   // チャレンジ中はここで終了 → 手数は増やさない
    }

    // ────────────────────────────────────────────────
    // 3. 通常モード（ここまで来たら通常操作）
    // ────────────────────────────────────────────────
    // ※ flinput === "0" かつ !isC3Mode の場合のみ到達
    playClickSound();

    const id = $(this).attr("id");
    const panelNum = id.replace("p", "");   // "p1" → "1"

    // 回転実行
    window["pm" + panelNum](false);

    // 手数カウントアップ（通常モード専用）←要らない？
   // let currentTes = parseInt($("#tebo").text()) || 0;
   // $("#tebo").html(currentTes + 1);

    // 判定を少し遅らせてアニメーション完了後に
    setTimeout(() => {
        hantei(true);
    }, 700);
});

    // ボタン類の処理
    $('.bot, .bot-special').click(function() {
        if (isAnimating) return;
        playClickSound();
        var btnId = $(this).attr("id");

        switch(btnId) {
		case "tebo":

                if ($("#flinput").text() === "0") {

                    var currentTes = $("#tebo").text();

                    var nextTes = (currentTes === "?") ? 1 : (parseInt(currentTes) + 1) % 12;

                    $("#tebo").html(nextTes);

                }

                break;
            case "mode-select":
                selectedSteps = (selectedSteps === 3) ? 4 : 3;
                $(this).html("MODE: " + selectedSteps);
                break;

            case "challenge-start":
                isC3Mode = false;
                isInputMode = false;
                $("#flinput").html("0");
                prepareMode("READY?", "#f1c40f");
                
                isAnimating = true; 
                $("#tebo").html(selectedSteps);
                setDailyChallenge(selectedSteps); 
                
                // 【修正】タイマーを変数に格納する
                if (challengeTimer) clearTimeout(challengeTimer);
                challengeTimer = setTimeout(() => {
                    $("#hyouji").html("- ".repeat(selectedSteps).trim());
                    startTime = performance.now(); 
                    isC3Mode = true; 
                    isAnimating = false; 
                    challengeTimer = null; // 実行完了
                }, 1000);
                break;

            case "sebo":
    executeSet(); // すべてのモードから通常へ戻り、問題を生成・保存
    break;

case "input":
    if ($("#flinput").text() === "0") {
        // インプット開始
        isC3Mode = false;
        prepareMode("Input mode", "#e67e22");
        $("#flinput").html("1");
        $("#tebo").html("?");
    } else {
        // インプット終了（確定）
        executeSet(); 
    }
    break;

            case "resebo": // リセットボタン：全モードから通常へ強制帰還＆ロード
                clearEffects(); 
                rmem(); 
                break;

            case "rank": showGlobalRank(selectedSteps); break;
        }
    });
}

// --- セットボタンの共通ロジック ---
// セットボタンの共通ロジック（問題生成 & セーブ & 通常モード移行）
function executeSet() {
    // 1. 状態のキャプチャと解除
    const isInputNow = ($("#flinput").text() === "1");
    isC3Mode = false;
    inputBuffer = "";
    startTime = 0;
    $("#flinput").html("0");
    clearEffects();

    // 2. インプットモード出口のロジック（ここが最優先）
    if (isInputNow) {
        if (!checkInvalid()) {
            // 【成功】重複なし：今の盤面をそのまま維持する（set0は絶対に呼ばない）
            $("#tebo").html("?"); 
            $("#kotae").text("none");
            // ※ここで reflection を「静止状態」で行うため、変数を同期
            n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text();
            n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text();
            n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
        } else {
            // 【失敗】重複あり：掟に基づき HOME へ強制送還
            set0(false);
            $("#tebo").html("0");
            $("#kotae").text("none");
        }
    } else {
        // 3. 通常時・チャレンジ中からの「セット（問題生成）」
        let teboText = $("#tebo").text();
        let loopCount = (teboText === "?" || teboText === "0") ? 0 : parseInt(teboText);

        if (loopCount === 0) {
            set0(false);
            $("#tebo").html("0");
            $("#kotae").text("none");
        } else {
            // 新問題を生成するために一旦 HOME にしてからシャッフル
            set0(false); 
            let history = [];
            for (var i = 0; i < loopCount; i++) { 
                history.push(mset()); 
            }
            $("#kotae").text(history.reverse().join(" "));
        }
    }

    // 4. 最後に今の状態（インプットした盤面、または生成した問題）をセーブ
    wmem(); 
    
    // 5. 表示更新
    $("#hyouji").html("Let's Try").css("color", "");
    reflectAllExcept(null, true); 
}// 重複チェック補助
function checkInvalid() {
    var checkArr = [];
    for(var i = 1; i <= 9; i++) { checkArr.push($("#p" + i).text()); }
    for(var n = 1; n <= 9; n++) {
        if(!checkArr.includes(String(n))) return true;
    }
    return false;
}

// ==========================================
// 4. 補助関数
// ==========================================
function reflectAllExcept(fixedId, isSilent) {
    var vals = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
    
    // 【修正】ここでの自動消去を削除。
    // ユーザーが操作しても「答え」は表示されたままにします。

    if (isSilent) {
        for (var i = 1; i <= 9; i++) {
            gsap.set("#p" + i, { x: pos[i].x, y: pos[i].y });
            $("#p" + i).text(vals[i - 1]);
        }
        isAnimating = false; 
        return;
    }
    
    isAnimating = true; 
    let movingCount = 0;
    let finishedCount = 0;

    for (let i = 1; i <= 9; i++) {
        let targetPanel = $("#p" + i);
        let nextPosIndex = -1;
        for (let j = 0; j < 9; j++) { 
            if (String(vals[j]) === targetPanel.text()) { 
                nextPosIndex = j + 1; 
                break; 
            } 
        }
        
        let currentX = gsap.getProperty(targetPanel[0], "x");
        let currentY = gsap.getProperty(targetPanel[0], "y");
        
        if (nextPosIndex !== -1 && (currentX !== pos[nextPosIndex].x || currentY !== pos[nextPosIndex].y)) {
            movingCount++;
            gsap.to(targetPanel, {
                duration: 0.6, x: pos[nextPosIndex].x, y: pos[nextPosIndex].y, ease: "power2.inOut",
                onComplete: () => {
                    gsap.set(targetPanel, { x: pos[i].x, y: pos[i].y }); 
                    targetPanel.text(vals[i - 1]);
                    finishedCount++;
                    if (finishedCount === movingCount) { isAnimating = false; }
                }
            });
        } else {
            gsap.set(targetPanel, { x: pos[i].x, y: pos[i].y });
            targetPanel.text(vals[i - 1]);
        }
    }
    if (movingCount === 0) { isAnimating = false; }
}
function clearEffects() {
    $(".panel").removeClass("complete-glow");
    $("#content").removeClass("victory-bg");
    $("#hyouji").css("color", "").css("text-shadow", "").html("Let's Try");
}

function hantei(showCelebration) {
    // 現在の全パネルの数字を取得
    var n = [];
    for (var i = 1; i <= 9; i++) {
        n[i] = $("#p" + i).text();
    }
    
    // 【判定】1〜8が正解位置にあるか（9は空き枠扱い）
    const isComplete = (n[1] == "1" && n[2] == "2" && n[3] == "3" && 
                        n[4] == "4" && n[5] == "5" && n[6] == "6" && 
                        n[7] == "7" && n[8] == "8");

    if (isComplete) {
        // --- 【A. 正解時の処理】 ---
        if (showCelebration) {
            // 音声演出
            if (isC3Mode) { 
                playChallengeVoice(selectedSteps); 
            } else { 
                playCompleteSound(); 
            }

            // 視覚演出の追加
            $(".panel").addClass("complete-glow");
            $("#content").addClass("victory-bg");

            // タイム計算
            let clearTime = 0;
            if (startTime > 0) {
                clearTime = ((performance.now() - startTime) / 1000).toFixed(2);
            }

            // チャレンジモード特有のクリーンアップ
            if (isC3Mode) {
               
                
                // タイム表示とランキング登録
                if (clearTime > 0) {
                    $("#hyouji").html(clearTime + "s").css("color", "#2ecc71");
                    handleRanking(clearTime);
                }
            } else {
                // 通常モードでの完成
                $("#hyouji").html("COMPLETE!").css("color", "#2ecc71");
            }

            // 1秒後に状態をリセットして次の操作を待つ
            setTimeout(() => {
                startTime = 0;
                isC3Mode = false;
                inputBuffer = "";
                // 演出用クラスは残しても良いが、必要ならここで clearEffects()
            }, 1000);
        }
    } else {
        // --- 【B. 不正解（MISS）または移動直後の処理】 ---
        if (isC3Mode && showCelebration && !isAnimating) {
            // チャレンジモードで指定手数入力した結果、間違っていた場合
            isAnimating = true; // 復旧演出が終わるまで操作ロック
            
            // 1. MISS警告表示
            $("#hyouji").html("MISS!").css("color", "#ff4757");
            
            // 2. 0.8秒待ってから盤面を「その問題の最初」にリセット
            setTimeout(() => {
                // 通常の記憶(sn)ではなく、今回の問題(tempSn)をロード
                for (var i = 1; i <= 9; i++) {
                    window["n" + i] = tempSn[i];
                }
               // 表示を入力待ち状態に戻す
                $("#hyouji").html("- ".repeat(selectedSteps).trim()).css("color", ""); 
                inputBuffer = ""; // 入力をやり直し
                
                reflectAllExcept(null, true); // 静かに盤面復元
                isAnimating = false; 
            }, 800);
            
        } else if (!isC3Mode) {
            // 通常モードで動かしている最中は演出をクリアするだけ
            clearEffects();
        }
    }
}

function startCometLoop(panelId) {
  if (cometInterval) return;
  const path = cometPaths[panelId];
  if (!path) return;

  let step = 0;
  const stepTime = 250; // 約2秒で1周

  cometInterval = setInterval(() => {
    // 前の残像を全部消す
    path.forEach(idx => $("#p" + idx).removeClass("light-1 light-2 light-3 light-4"));

    const len = path.length;

    // 頭
    $("#p" + path[step % len]).addClass("light-1");

    // 胴体（1ステップ前）
    if (step >= 1) {
      $("#p" + path[(step - 1 + len) % len]).addClass("light-2");
    }
    // 尾（2ステップ前）
    if (step >= 2) {
      $("#p" + path[(step - 2 + len) % len]).addClass("light-3");
    }
    // 消え際（3ステップ前）
    if (step >= 3) {
      $("#p" + path[(step - 3 + len) % len]).addClass("light-4");
    }

    step++;
  }, stepTime);
}

function stopCometLoop() {
  if (cometInterval) {
    clearInterval(cometInterval);
    cometInterval = null;
  }
  // 残像完全消去
  $(".panel").removeClass("light-1 light-2 light-3 light-4");
}
// pm関数群
function pm1(s) { n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n2; n2=n5; n5=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=tmp; reflectAllExcept(null, s); }
function pm2(s) { n1=$("#p1").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n5; n5=tmp; reflectAllExcept(null, s); }
function pm3(s) { n1=$("#p1").text(); n2=$("#p2").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n5; n5=tmp; reflectAllExcept(null, s); }
function pm4(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n5; n5=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp; reflectAllExcept(null, s); }
function pm5(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp; reflectAllExcept(null, s); }
function pm6(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n5; n5=tmp; reflectAllExcept(null, s); }
function pm7(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n4; n4=n5; n5=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=tmp; reflectAllExcept(null, s); }
function pm8(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n9=$("#p9").text(); var tmp=n7; n7=n5; n5=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=tmp; reflectAllExcept(null, s); }
function pm9(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); var tmp=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n5; n5=tmp; reflectAllExcept(null, s); }

function wmem() { 
    sn1=$("#p1").text(); sn2=$("#p2").text(); sn3=$("#p3").text();
    sn4=$("#p4").text(); sn5=$("#p5").text(); sn6=$("#p6").text();
    sn7=$("#p7").text(); sn8=$("#p8").text(); sn9=$("#p9").text();

    // 【修正】parseIntを外し、表示されている文字（"?" や "3" など）をそのまま保存
    stes = $("#tebo").text(); 
    saveKotae = $("#kotae").text();
}
function rmem() {
    // 【最重要】動いている開始タイマーを即座に破棄
    if (challengeTimer) {
        clearTimeout(challengeTimer);
        challengeTimer = null;
    }

    // 1. セーブデータのロード
    n1=sn1; n2=sn2; n3=sn3; n4=sn4; n5=sn5; n6=sn6; n7=sn7; n8=sn8; n9=sn9;
    
    // 2. モードの完全解除
    $("#flinput").html("0");
    isC3Mode = false;
    isAnimating = false;
    inputBuffer = "";
    startTime = 0; // タイムもリセット
    
    // 3. 手数と答えの復旧
    $("#tebo").html(stes);
    $("#kotae").text(saveKotae || "none");
    
    // 4. 表示の復旧
    $("#hyouji").html("Let's Try").css("color", ""); 
    for (var i = 1; i <= 9; i++) { $("#p" + i).text(window["n" + i]); }
    reflectAllExcept(null, true);
}function set0(h) { n1=1; n2=2; n3=3; n4=4; n5=5; n6=6; n7=7; n8=8; n9=9; reflectAllExcept(null, true); }
function mset() { 
    // 1〜9の「場所」をランダムに決定
    var mov = Math.floor(Math.random() * 9) + 1; 
    
    // その「場所」にあるパネルに今書かれている「数字」を取得
    var targetNum = $("#p" + mov).text(); 
    
    // 回転処理を実行
    for(var i = 0; i < 7; i++) {
        window["pm" + mov](true); 
    }
    
    return targetNum; // 「場所」ではなく「数字」を返す
}

async function setDailyChallenge(steps) {
    set0(false); 

    try {
        // GASにシード値だけをリクエスト
        const url = `${GAS_URL}?action=getDailySeed&steps=${steps}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error("GAS response not ok");
        }
        
        const data = await response.json();
        let seed = data.seed;  // GASから返ってきた確実なJSTベースのseed値

        // ここから先は元のロジックをほぼそのまま使用
        for(let i = 0; i < steps; i++) {
            seed = (seed * 9301 + 49297) % 233280;
            let move = Math.floor((seed / 233280) * 9) + 1;
            for(let j = 0; j < 7; j++) {
                window["pm" + move](true);
            }
        }
        
        // 一時変数に保存（元のまま）
        for(var i = 1; i <= 9; i++) {
            tempSn[i] = $("#p" + i).text();
        }

    } catch (e) {
        console.error("GASシード取得エラー、フォールバックします", e);
        
        // フォールバック：元のクライアント側計算（一時的に残す）
        const d = new Date();
        let seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) * (steps * 7);

        for(let i = 0; i < steps; i++) {
            seed = (seed * 9301 + 49297) % 233280;
            let move = Math.floor((seed / 233280) * 9) + 1;
            for(let j = 0; j < 7; j++) {
                window["pm" + move](true);
            }
        }
        
        for(var i = 1; i <= 9; i++) {
            tempSn[i] = $("#p" + i).text();
        }
    }
}
// ==========================================
// 5. ランキングシステム（世界ランキング対応版）
// ==========================================

// 1. スコアをGASに送信する関数
async function handleRanking(clearTime) {
    const today = getDailySeed();
    const saveKey = `cyclogic_scores_${selectedSteps}_${today}`;
    
    // ローカルにも保存（バックアップ）
    let scores = JSON.parse(localStorage.getItem(saveKey) || "[]");
    scores.push(parseFloat(clearTime));
    localStorage.setItem(saveKey, JSON.stringify(scores));

    // GASへデータを送信
    try {
        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors", // GASの仕様上、最初はレスポンスを無視して送る
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: selectedSteps,
                time: parseFloat(clearTime)
            })
        });

        // 送信直後はデータ反映に少し時間がかかるため、0.5秒待ってから表示
        setTimeout(() => {
            showGlobalRank(selectedSteps);
        }, 500);

    } catch (e) {
        console.error("Ranking Sync Error:", e);
        showGlobalRank(selectedSteps); // 失敗してもローカル版を表示
    }
}

// 2. GASから統計を取得して表示する関数
async function showGlobalRank(steps) {
    $("#modal-title").text(`MODE: ${steps} WORLD RANK`);
    $("#rank-list").html("<div style='padding:20px; color:#3498db;'>CONNECTING...</div>");
    $("#rank-average").text("AVERAGE: --s");
    $("#rank-modal").fadeIn(200);

    try {
        // GASから最新データを取得 (GETリクエスト)
        const response = await fetch(`${GAS_URL}?mode=${steps}`);
        const data = await response.json();

        let listHtml = "";
        if (!data.top5 || data.top5.length === 0) {
            listHtml = "<div style='padding:20px;'>NO DATA</div>";
        } else {
            // 上位5位のリスト作成
            data.top5.forEach((s, i) => {
                listHtml += `<div class="rank-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px dotted #555;">
                                <span style="color:#f1c40f;">${i+1}st</span>
                                <span style="font-family:'Orbitron';">${parseFloat(s).toFixed(2)}s</span>
                             </div>`;
            });
            // 平均とプレイ人数の更新
            $("#rank-average").html(`AVG: <span style="color:#2ecc71;">${data.average}s</span> / PLAYS: <span style="color:#3498db;">${data.totalPlays}</span>`);
        }
        $("#rank-list").html(listHtml);

    } catch (e) {
        // 通信失敗時のバックアップ表示（ローカルデータを使用）
        console.warn("Offline Mode: using local data");
        const today = getDailySeed();
        const localScores = JSON.parse(localStorage.getItem(`cyclogic_scores_${steps}_${today}`) || "[]");
        let listHtml = "<div style='color:#e74c3c; font-size:12px; margin-bottom:10px;'>OFFLINE MODE</div>";
        
        localScores.sort((a,b)=>a-b).slice(0,5).forEach((s, i) => {
            listHtml += `<div class="rank-item" style="display:flex; justify-content:space-between; padding:8px;">
                            <span>${i+1}.</span><span>${s.toFixed(2)}s</span>
                         </div>`;
        });
        $("#rank-list").html(listHtml || "NO LOCAL DATA");
    }
}
function getDailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// モード切替時の共通処理（HOME状態を記憶に定着させる）
function prepareMode(message, color) {
    set0(false);
    $("#kotae").text("none");
    // wmem(); // ← ここでのセーブは一旦ストップ。問題生成後に任せます。
    
    clearEffects();
    $("#hyouji").html(message).css("color", color || "");
    inputBuffer = "";
    isC3Mode = false;
}
$(document).on('click', '.close-modal, #rank-modal', function(e) {
    if (e.target === this || $(e.target).hasClass('close-modal')) {
        $("#rank-modal").fadeOut(200);
    }
});

$(function () { main(); });