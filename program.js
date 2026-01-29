// ==========================================
// 変数・定数定義
// ==========================================
var n1, n2, n3, n4, n5, n6, n7, n8, n9, tes;
var sn1, sn2, sn3, sn4, sn5, sn6, sn7, sn8, sn9, stes;
var kotae, mov, flinput;
var isAnimating = false; // アニメーション中フラグ

const pos = {
  1: {x: 0,   y: 0},   2: {x: 103, y: 0},   3: {x: 206, y: 0},
  4: {x: 0,   y: 103}, 5: {x: 103, y: 103}, 6: {x: 206, y: 103},
  7: {x: 0,   y: 206}, 8: {x: 103, y: 206}, 9: {x: 206, y: 206}
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

  $('.panel').click(function() {
    if (isAnimating) return;
    flinput = $("#flinput").text();
    if (flinput === "0") {
      playClickSound(); // 操作音
      var id = $(this).attr("id");
      switch(id) {
        case "p1": pm1(false); break; case "p2": pm2(false); break;
        case "p3": pm3(false); break; case "p4": pm4(false); break;
        case "p5": pm5(false); break; case "p6": pm6(false); break;
        case "p7": pm7(false); break; case "p8": pm8(false); break;
        case "p9": pm9(false); break;
      }
    } else if (flinput === "1") {
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
        onComplete: (function(p, val, idx) {
          return function() {
            gsap.set(p, { x: pos[idx].x, y: pos[idx].y }); p.text(val);
            completedCount++; if (completedCount >= 8) { isAnimating = false; hantei(true); }
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
function mset() { mov = Math.floor(Math.random()*9)+1; $("#kotae2").html(mov); for(var i=0; i<7; i++) window["pm"+mov](true); }

$(function () { main(); });
