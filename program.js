
// 変数宣言はそのまま維持
var n1, n2, n3, n4, n5, n6, n7, n8, n9, tes;
var sn1, sn2, sn3, sn4, sn5, sn6, sn7, sn8, sn9, stes;
var kotae, mov, flinput;

function main() { 
  wmem(); 

  // --- パネルクリック：ここは「回転」と「判定」だけに専念させます ---
  $('.panel').click(function() {
    flinput = $("#flinput").text();
    
    if (flinput === "0") {
      // あなたの pmロジックを呼び出すだけ。手数はここでは動かしません。
      var id = $(this).attr("id");
      switch(id) {
        case "p1": pm1(); break;
        case "p2": pm2(); break;
        case "p3": pm3(); break;
        case "p4": pm4(); break;
        case "p5": pm5(); break;
        case "p6": pm6(); break;
        case "p7": pm7(); break;
        case "p8": pm8(); break;
        case "p9": pm9(); break;
      }
      hantei(); // 回転のあとに判定
    } else if (flinput === "1") {
      // INPUTモード時の数値切り替え
      var currentVal = parseInt($(this).text());
      $(this).html((currentVal % 9) + 1);
    }
  });

  // --- コントロールボタン：役割を明確に分離しました ---
  $('.bot, .bot-special').click(function() {
    tes = $("#tebo").text();
    flinput = $("#flinput").text();
    var btnId = $(this).attr("id");

    switch(btnId) {
      
case "tebo":
        if (flinput === "0") {
          var currentTes = $("#tebo").text();
          var nextTes;

          if (currentTes === "?") {
            // 「？」の場合は、次に押したときに「1」にする（あるいは0に戻すなら0に）
            nextTes = 1;
          } else {
            // 通常の数字の場合は、これまで通り1〜11でループ
            nextTes = (parseInt(currentTes) + 1) % 12;
          }
          
          $("#tebo").html(nextTes);
        }
        break;
      case "sebo":

        // ★ここから追加：演出のリセット
        $(".panel").removeClass("complete-glow");
        $("#content").removeClass("victory-bg");
        $("#hyouji").css("color", "").css("text-shadow", ""); // CSSの設定に戻す
        // ★ここまで追加
        if (flinput === "0") {
          var tesText = $("#tebo").text();
          var loopCount = (tesText === "?") ? 0 : parseInt(tesText);
          if (tesText === "?") $("#tebo").html("0");

          set0(); 
          kotae = "";
          
          if (loopCount > 0) {
            for (var i = 0; i < loopCount; i++) {
              mset();
              kotae = $("#kotae2").text() + kotae;
            }
            $("#kotae").html(kotae); // 正解を表示
          } else {
            // 手数0（リセット）の時は解答もなし
            $("#kotae").html("none");
          }
          
          wmem();
          $("#hyouji").html("Let's Try");
        }
        break;

      case "resebo":
	$(".panel").removeClass("complete-glow");
        $("#content").removeClass("victory-bg");
        $("#hyouji").css("color", "").css("text-shadow", "");
        rmem(); 
        break;

     case "input":
	$(".panel").removeClass("complete-glow");
        $("#content").removeClass("victory-bg");
        $("#hyouji").css("color", "").css("text-shadow", ""); // CSSの設定に戻す
        if (flinput === "0") {
          // --- INPUTモード開始 ---
          $("#flinput").html("1");
          $("#hyouji").html("Input mode");
          $("#tebo").html("0");
          $("#kotae").html("......");
        } else {
          // --- INPUTモード終了（脱出処理） ---
          var currentNumbers = [];
          var isDuplicate = false;

          // 1. 重複チェック
          for (var i = 1; i <= 9; i++) {
            var val = $("#p" + i).text();
            if (currentNumbers.includes(val)) {
              isDuplicate = true;
              break;
            }
            currentNumbers.push(val);
          }

          // 2. 判定結果による分岐
          if (isDuplicate) {
            $("#hyouji").html("Duplicate! Reset.");
            set0(); // 盤面を1〜9にリセット
            $("#kotae").html("none");
            $("#tebo").html("0");
          } else {
            $("#hyouji").html("Let's Try");
            $("#tebo").html("?");
            $("#kotae").html("??????");
          }

          // 3. 【重要】何があっても通常モード(0)に戻す
          $("#flinput").html("0"); 
          
          // 4. 状態を保存
          wmem();
        }
        break;
    }
  });
}

// ※以下、pm1() ~ pm9() および補助関数（wmem, rmem, hantei, set0, mset）は
//   先ほどの「あなたのロジックを再現したもの」をそのまま後ろに繋げてください。

// --- 補助関数群（あなたのロジックをそのまま移植） ---

function wmem() {
  sn1=$("#p1").text(); sn2=$("#p2").text(); sn3=$("#p3").text();
  sn4=$("#p4").text(); sn5=$("#p5").text(); sn6=$("#p6").text();
  sn7=$("#p7").text(); sn8=$("#p8").text(); sn9=$("#p9").text();
  stes=$("#tebo").text();
}

function rmem() {
  $("#p1").html(sn1); $("#p2").html(sn2); $("#p3").html(sn3);
  $("#p4").html(sn4); $("#p5").html(sn5); $("#p6").html(sn6);
  $("#p7").html(sn7); $("#p8").html(sn8); $("#p9").html(sn9);
  $("#tebo").html(stes);
  $("#hyouji").html("Let's Try");
}

function hantei() {
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text();
  n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text();
  n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();

  // 1〜8まで正しく並んでいるかチェック
  if(n1=="1"&&n2=="2"&&n3=="3"&&n4=="4"&&n5=="5"&&n6=="6"&&n7=="7"&&n8=="8") {
    
    // 【祝】完成時の演出
    $("#hyouji").html("COMPLETE!")
               .css("color", "#2ecc71")
               .css("text-shadow", "0 0 20px #2ecc71");

    // パネルと背景にアニメーション用のクラスを追加（CSS側で定義したもの）
    $(".panel").addClass("complete-glow");
    $("#content").addClass("victory-bg");

  } else {
    // 【道中】まだ揃っていない時の表示
    $("#hyouji").html("Let's Try")
               .css("color", "#ff0033") // 元のネオンレッドに戻す
               .css("text-shadow", "0 0 5px #000, 0 0 10px #ff0033, 0 0 20px #ff0033");

    // アニメーション用クラスを外して通常の状態に戻す
    $(".panel").removeClass("complete-glow");
    $("#content").removeClass("victory-bg");
  }
}

function set0() {
  $("#p1").html(1); $("#p2").html(2); $("#p3").html(3);
  $("#p4").html(4); $("#p5").html(5); $("#p6").html(6);
  $("#p7").html(7); $("#p8").html(8); $("#p9").html(9);
}

function mset() {
  mov = Math.floor(Math.random()*9)+1;
  $("#kotae2").html(mov);
  // あなたの「逆回転7回」による問題生成ロジックを忠実に実行
  for(var i=0; i<7; i++) {
    window["pm" + mov]();
  }
}

// --- 回転ロジック修正版 ---

// 共通の回転順序（外周＋中央の5番を含む大きな円）
// 時計回り：1 → 2 → 3 → 6 → 9 → 8 → 7 → 4 → (1へ戻る)
// ※5番が軸でない場合、どこかで5番がこの列に割り込む形になります。

function pm1() { // 1固定：2→3→6→9→8→7→4→5→2
  n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text();
  n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  var tmp=n2; n2=n5; n5=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=tmp;
  reflectAllExcept(1);
}

function pm2() { // 2固定：1→5→3→6→9→8→7→4→1
  n1=$("#p1").text(); n3=$("#p3").text(); n4=$("#p4").text(); n5=$("#p5").text();
  n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n5; n5=tmp;
  reflectAllExcept(2);
}

function pm3() { // 3固定：2が5へ、5が6へ...（時計回り）
  n1=$("#p1").text(); n2=$("#p2").text(); n4=$("#p4").text(); n5=$("#p5").text();
  n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  // 順序: 2→1, 1→4, 4→7, 7→8, 8→9, 9→6, 6→5, 5→2 (逆順で代入して時計回りに)
  var tmp=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n5; n5=tmp;
  reflectAllExcept(3);
}

function pm4() { // 4固定：1→2→3→6→9→8→7→5→1
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n5=$("#p5").text();
  n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  var tmp=n1; n1=n5; n5=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp;
  reflectAllExcept(4);
}

function pm5() { // 5固定：1→2→3→6→9→8→7→4→1
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text();
  n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  var tmp=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=tmp;
  reflectAllExcept(5);
}
function pm6() { // 6固定：3が5へ、5が9へ...（時計回り）
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text();
  n5=$("#p5").text(); n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
  // 順序: 3→2, 2→1, 1→4, 4→7, 7→8, 8→9, 9→5, 5→3
  var tmp=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n9; n9=n5; n5=tmp;
  reflectAllExcept(6);
}

function pm7() { // 7固定：4→1→2→3→6→9→8→5→4
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text();
  n5=$("#p5").text(); n6=$("#p6").text(); n8=$("#p8").text(); n9=$("#p9").text();
  var tmp=n4; n4=n5; n5=n8; n8=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=tmp;
  reflectAllExcept(7);
}

function pm8() { // 8固定：7→4→1→2→3→6→9→5→7
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text();
  n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n9=$("#p9").text();
  var tmp=n7; n7=n5; n5=n9; n9=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=tmp;
  reflectAllExcept(8);
}

function pm9() { // 9固定：6が5へ、5が8へ...（時計回り）
  n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text(); n4=$("#p4").text();
  n5=$("#p5").text(); n6=$("#p6").text(); n7=$("#p7").text(); n8=$("#p8").text();
  // 順序: 6→3, 3→2, 2→1, 1→4, 4→7, 7→8, 8→5, 5→6
  var tmp=n6; n6=n3; n3=n2; n2=n1; n1=n4; n4=n7; n7=n8; n8=n5; n5=tmp;
  reflectAllExcept(9);
}
// 共通：反映関数（念のためn1〜n9すべてを再定義）
function reflectAllExcept(fixedId) {
  var vals = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
  for(var i=1; i<=9; i++) {
    if(i !== fixedId) {
      $("#p"+i).text(vals[i-1]);
    }
  }
}
$(function () {
  main();
});