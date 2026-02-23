// ==========================================
// 変数・定数定義
// ==========================================
var n1, n2, n3, n4, n5, n6, n7, n8, n9, tes;
var sn1, sn2, sn3, sn4, sn5, sn6, sn7, sn8, sn9, stes;
var kotae, mov, flinput;
var isAnimating = false; // アニメーション中フラグ


let cometDelayTimer = null; // ディレイ用のタイマー
let cometInterval = null;

const pos = {
  1: {x: 0,   y: 0},   2: {x: 103, y: 0},   3: {x: 206, y: 0},
  4: {x: 0,   y: 103}, 5: {x: 103, y: 103}, 6: {x: 206, y: 103},
  7: {x: 0,   y: 206}, 8: {x: 103, y: 206}, 9: {x: 206, y: 206}
};
// 各パネルを叩いた時に動く8枚の「位置」の順序
const cometPaths = {
  "p1": [5, 2, 3, 6, 9, 8, 7, 4],
  "p2": [5, 3, 6, 9, 8, 7, 4, 1],
  "p3": [5, 6, 9, 8, 7, 4, 1, 2],
  "p4": [5, 1, 2, 3, 6, 9, 8, 7],
  "p5": [2, 3, 6, 9, 8, 7, 4, 1], // 外周回転
  "p6": [5, 9, 8, 7, 4, 1, 2, 3],
  "p7": [5, 4, 1, 2, 3, 6, 9, 8],
  "p8": [5, 7, 4, 1, 2, 3, 6, 9],
  "p9": [5, 8, 7, 4, 1, 2, 3, 6]
};

// ==========================================
// 音声再生システム
// ==========================================
function playClickSound() {
  const s = document.getElementById("sound-click");
  if (s) { s.currentTime = 0; s.play(); }
}

function playCompleteSound() {
  const s = document.getElementById("sound-complete"); //
  if (s) { s.currentTime = 0; s.play(); } //
}

// ==========================================
// メイン処理
// ==========================================
function main() { 
  wmem(); 
  // 初期配置
  for(var i = 1; i <= 9; i++) { gsap.set("#p" + i, { x: pos[i].x, y: pos[i].y }); }

// --- 1. 彗星：ホバー/タッチ開始（修正版） ---
$('.panel').on('mouseenter touchstart', function(e) {
  // アニメーション中、またはインプットモードなら何もしない
  if (isAnimating || $("#flinput").text() === "1") return;
  
  const id = $(this).attr("id");

  if (cometDelayTimer) clearTimeout(cometDelayTimer);

  cometDelayTimer = setTimeout(() => {
    // タイマーが発火した瞬間にもう一度チェック（移動中に発火するのを防ぐ）
    if (!isAnimating) {
      startCometLoop(id);
    }
  }, 1000); 
});

// --- 2. 彗星：離れた時（タイマーもクリアする） ---
$('.panel').on('mouseleave touchend', function(e) {
  // ループを止める
  stopCometLoop();
  // まだループが始まっていないタイマーもキャンセル
  if (cometDelayTimer) {
    clearTimeout(cometDelayTimer);
    cometDelayTimer = null;
  }
});

 // 3. 【確定操作】クリックした
  $('.panel').click(function() {
    if (isAnimating) return;
    
    flinput = $("#flinput").text();
    if (flinput === "0") {
      stopCometLoop(); // 念のためループを止めて消去
      playClickSound();
      
      var id = $(this).attr("id");
      // 実際の回転ロジックを実行
      switch(id) {
        case "p1": pm1(false); break; case "p2": pm2(false); break;
        case "p3": pm3(false); break; case "p4": pm4(false); break;
        case "p5": pm5(false); break; case "p6": pm6(false); break;
        case "p7": pm7(false); break; case "p8": pm8(false); break;
        case "p9": pm9(false); break;
      }
    } else if (flinput === "1") {
      // インプットモード
      var currentVal = parseInt($(this).text());
      $(this).html((currentVal % 9) + 1);
    }
  });

  $('.bot, .bot-special').click(function() {
    playClickSound(); // ボタン操作音
    var btnId = $(this).attr("id");
    switch(btnId) {
      case "tebo":
        if ($("#flinput").text() === "0") {
          var currentTes = $("#tebo").text();
          var nextTes = (currentTes === "?") ? 1 : (parseInt(currentTes) + 1) % 12;
          $("#tebo").html(nextTes);
        }
        break;
      case "sebo":
        clearEffects();
        if ($("#flinput").text() === "0") {
          var loopCount = ($("#tebo").text() === "?") ? 0 : parseInt($("#tebo").text());
          if ($("#tebo").text() === "?") $("#tebo").html("0");
          set0(loopCount > 0); 
          kotae = "";
          if (loopCount > 0) {
            for (var i = 0; i < loopCount; i++) { mset(); kotae = $("#kotae2").text() + kotae; }
            $("#kotae").html(kotae);
          } else { $("#kotae").html("none"); }
          wmem();
        }
        break;
      case "resebo": clearEffects(); rmem(); break;
      case "input":
        clearEffects();
        if ($("#flinput").text() === "0") {
          $("#flinput").html("1"); $("#hyouji").html("Input mode");
        } else {
          var currentNumbers = []; var isDuplicate = false;
          for (var i = 1; i <= 9; i++) {
            var val = $("#p" + i).text();
            if (currentNumbers.includes(val)) { isDuplicate = true; break; }
            currentNumbers.push(val);
          }

          if (isDuplicate) { 
            // 【重複時】全てを白紙に戻す
            set0(false); 
            $("#tebo").html("0");    // 手数を0に
            $("#kotae").html("none"); // 解答をクリア
            $("#hyouji").html("Duplicate! Reset."); 
          } else { 
            // 【正常終了時】ここからスタート
            $("#tebo").html("?"); 
            $("#kotae").html("?"); 
            $("#hyouji").html("Let's Try"); 
            hantei(false); 
          }
          $("#flinput").html("0"); 
          wmem(); // 現在の状態（0や?を含む）を記憶
        }
        break;
    }
  });
}

// ==========================================
// 補助関数・ロジック
// ==========================================
// --- 彗星ループ制御用の新しい補助関数 ---
// --- 3. 補助関数：スピードを2秒に調整 ---
function startCometLoop(panelId) {
  if (cometInterval) return;
  const path = cometPaths[panelId];
  if (!path) return;

  let step = 0;
  const stepTime = 250; // 一周2秒ペース

  cometInterval = setInterval(() => {
    // 全パネルのクラスをリセット
    path.forEach(idx => {
      $("#p" + idx).removeClass("light-1 light-2 light-3 light-4");
    });

    const len = path.length;

    // --- ここが「出だし」を自然にするポイント ---
    // stepが0の時は頭だけ、1の時は頭と胴体…という風に段階的に出す
    
    // 常に「頭」は表示
    $("#p" + path[step % len]).addClass("light-1");

    // 1ステップ目以降なら「胴体」を出す
    if (step >= 1) {
      $("#p" + path[(step - 1 + len) % len]).addClass("light-2");
    }
    // 2ステップ目以降なら「尾」を出す
    if (step >= 2) {
      $("#p" + path[(step - 2 + len) % len]).addClass("light-3");
    }
    // 3ステップ目以降なら「消え際」を出す
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
  // 全てのパネルからエフェクトクラスを強制消去（残像残り防止）
  $(".panel").removeClass("light-1 light-2 light-3 light-4");
}

async function playComet(panelId) {
  const path = cometPaths[panelId];
  if (!path) return;

  const stepTime = 125; // 1000ms / 8枚 = 125ms

  // 11ステップ実行（8枚 + 残像が消えるまでの3枚分）
  for (let i = 0; i < path.length + 3; i++) {
    // 全体のクラスを一旦クリア（彗星用のみ）
    path.forEach(idx => {
      $("#p" + idx).removeClass("light-1 light-2 light-3 light-4");
    });

    // 各段階の表示
    if (path[i])     $("#p" + path[i]).addClass("light-1");     // 頭
    if (path[i - 1]) $("#p" + path[i - 1]).addClass("light-2"); // 胴
    if (path[i - 2]) $("#p" + path[i - 2]).addClass("light-3"); // 尾
    if (path[i - 3]) $("#p" + path[i - 3]).addClass("light-4"); // 消え際

    await new Promise(resolve => setTimeout(resolve, stepTime));
  }
}

function clearEffects() {
  $(".panel").removeClass("complete-glow");
  $("#content").removeClass("victory-bg");
  $("#hyouji").css("color", "").css("text-shadow", "").html("Let's Try");
}

function hantei(showCelebration) {
  var n = [];
  for(var i=1; i<=9; i++) n[i] = $("#p"+i).text();
  if(n[1]=="1"&&n[2]=="2"&&n[3]=="3"&&n[4]=="4"&&n[5]=="5"&&n[6]=="6"&&n[7]=="7"&&n[8]=="8") {
    if (showCelebration) {
      playCompleteSound(); // 正解音！
      $("#hyouji").html("COMPLETE!").css("color", "#2ecc71").css("text-shadow", "0 0 20px #2ecc71");
      $(".panel").addClass("complete-glow"); $("#content").addClass("victory-bg");
    }
  } else { clearEffects(); }
}

function reflectAllExcept(fixedId, isSilent, isUserAction) {
  var vals = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
  if (isSilent) {
    for (var i = 1; i <= 9; i++) {
      gsap.set("#p"+i, { x: pos[i].x, y: pos[i].y });
      $("#p"+i).text(vals[i-1]);
    }
    isAnimating = false; hantei(false); return;
  }
  isAnimating = true; var completedCount = 0;
  for (var i = 1; i <= 9; i++) {
    var targetPanel = $("#p" + i);
    var nextPosIndex = -1;
    for (var j = 0; j < 9; j++) { if (String(vals[j]) === targetPanel.text()) { nextPosIndex = j + 1; break; } }
    if (nextPosIndex !== -1) {
      gsap.to(targetPanel, {
        duration: 0.6, x: pos[nextPosIndex].x, y: pos[nextPosIndex].y, ease: "power2.inOut",
        // reflectAllExcept 関数内の onComplete 部分を修正
onComplete: (function(p, val, idx) {
  return function() {
    gsap.set(p, { x: pos[idx].x, y: pos[idx].y }); 
    p.text(val);
    completedCount++; 
    
    if (completedCount >= 8) { 
      // 移動直後にすぐ彗星が出ないよう、少しだけ「isAnimating = true」を維持する
      setTimeout(() => {
        isAnimating = false; 
        hantei(true);
      }, 500); // 0.5秒のクールダウン（お好みで1000にしてもOK）
    }
  };
})(targetPanel, vals[i-1], i)
      });
    }
  }
}

// 共通化されたpm関数群 (pm9のバグも修正済み)
function pm1(s) { n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n2; n2=n5; n5=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=tmp; reflectAllExcept(1, s, true); }
function pm2(s) { n1=$("#p1").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n5; n5=tmp; reflectAllExcept(2, s, true); }
function pm3(s) { n1=$("#p1").text(); n2=$("#p2").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n5; n5=tmp; reflectAllExcept(3, s, true); }
function pm4(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n5; n5=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp; reflectAllExcept(4, s, true); }
function pm5(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp; reflectAllExcept(5, s, true); }
function pm6(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n5; n5=tmp; reflectAllExcept(6, s, true); }
function pm7(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n8=$("#p8").text(); n9=$("#p9").text(); var tmp=n4; n4=n5; n5=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=tmp; reflectAllExcept(7, s, true); }
function pm8(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n9=$("#p9").text(); var tmp=n7; n7=n5; n5=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=tmp; reflectAllExcept(8, s, true); }
function pm9(s) { n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); var tmp=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n5; n5=tmp; reflectAllExcept(9, s, true); }

function wmem() { sn1=$("#p1").text(); sn2=$("#p2").text(); sn3=$("#p3").text(); sn4=$("#p4").text(); sn5=$("#p5").text(); sn6=$("#p6").text(); sn7=$("#p7").text(); sn8=$("#p8").text(); sn9=$("#p9").text(); stes=$("#tebo").text(); }
function rmem() { n1=sn1; n2=sn2; n3=sn3; n4=sn4; n5=sn5; n6=sn6; n7=sn7; n8=sn8; n9=sn9; reflectAllExcept(null, true, false); $("#tebo").html(stes); }
function set0(h) { n1=1; n2=2; n3=3; n4=4; n5=5; n6=6; n7=7; n8=8; n9=9; reflectAllExcept(null, true, h); }
function mset() { 
  mov = Math.floor(Math.random()*9)+1; 
  // 修正箇所：叩くパネルの位置（mov）ではなく、その位置にある「数字」を取得して記録
  var panelNumber = $("#p" + mov).text();
  $("#kotae2").html(panelNumber); 
  
  for(var i=0; i<7; i++) window["pm"+mov](true); 
}
$(function () { main(); });
