function main() { 
  
  var n1 = $("#p1").text();
  var n2 = $("#p2").text();
  var n3 = $("#p3").text();
  var n4 = $("#p4").text();
  var n5 = $("#p5").text();
  var n6 = $("#p6").text();
  var n7 = $("#p7").text();
  var n8 = $("#p8").text();
  var n9 = $("#p9").text();
  var tes = $("#tebo").text();

  var sn1 = $("#p1").text();
  var sn2 = $("#p2").text();
  var sn3 = $("#p3").text();
  var sn4 = $("#p4").text();
  var sn5 = $("#p5").text();
  var sn6 = $("#p6").text();
  var sn7 = $("#p7").text();
  var sn8 = $("#p8").text();
  var sn9 = $("#p9").text();
  var stes = $("#tebo").text();

  var kotae = $("#kotae").text();
  var mov= $("#kotae2").text(); 

  $('.panel').click(function() {

    switch($(this).attr("id")) {
      case "p1":
        pm1();
        hantei();
      break;
      case "p2":
        pm2();
        hantei();
      break;
      case "p3":
        pm3();
        hantei();
      break;
      case "p4":
        pm4();
        hantei();
      break;
      case "p5":
        pm5();
        hantei();
      break;
      case "p6":
        pm6();
        hantei();
      break;
      case "p7":
        pm7();
        hantei();
      break;
      case "p8":
        pm8();
        hantei();
      break;
      case "p9":
        pm9();
        hantei();
      break;
    }
    
  });

$('.bot').click(function() {

    tes = $("#tebo").text();
   
    switch($(this).attr("id")) {
      case "tebo":
        switch(tes) {
          case "0":
            $("#tebo").html(1);
          break;
          case "1":
            $("#tebo").html(2);
          break;
          case "2":
            $("#tebo").html(3);
          break;
          case "3":
            $("#tebo").html(4);
          break;
          case "4":
            $("#tebo").html(5);
          break;
          case "5":
            $("#tebo").html(6);
          break;
          case "6":
            $("#tebo").html(7);
          break;
          case "7":
            $("#tebo").html(8);
          break;
          case "8":
            $("#tebo").html(9);
          break;
          case "9":
            $("#tebo").html(0);
          break;
      	}    
      break;
      case "sebo":
        switch(tes) {
          case "0":
            set0();
            kotae = "none";
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "1":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "2":
            set0();
         　 kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
            
          break;
          case "3":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "4":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "5":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "6":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "7":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "8":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
          case "9":
            set0();
            kotae = "";
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            mset();
            mov = $("#kotae2").text();
            kotae = mov + kotae;
            wmem();
            $("#kotae").html(kotae);
            $("#hyouji").html("Let's Try");
          break;
         }  
      break;
      case "resebo":
         rmem(); 
      break;
    }
    
  });
}

function wmem() {
  sn1 = $("#p1").text();
  sn2 = $("#p2").text();
  sn3 = $("#p3").text();
  sn4 = $("#p4").text();
  sn5 = $("#p5").text();
  sn6 = $("#p6").text();
  sn7 = $("#p7").text();
  sn8 = $("#p8").text();
  sn9 = $("#p9").text();
  stes = $("#tebo").text();
}

function rmem() {
    $("#p1").html(sn1);
    $("#p2").html(sn2);
    $("#p3").html(sn3);
    $("#p4").html(sn4);
    $("#p5").html(sn5);
    $("#p6").html(sn6);
    $("#p7").html(sn7);
    $("#p8").html(sn8);
    $("#p9").html(sn9);
    $("#tebo").html(stes);
    $("#hyouji").html("Let's Try");
}

function hantei() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  if(n1==1&&n2==2&&n3==3&&n4==4&&n5==5&&n6==6&&n7==7&&n8==8) {
    $("#hyouji").html("SUCCESS");
  }
}


function set0() {
  $("#p1").html(1);
  $("#p2").html(2);
  $("#p3").html(3);
  $("#p4").html(4);
  $("#p5").html(5);
  $("#p6").html(6);
  $("#p7").html(7);
  $("#p8").html(8);
  $("#p9").html(9);
}

function mset() {
  mov = Math.floor(Math.random()*9)+1;
　//kotae = mov +"." + kotae;
  $("#kotae2").html(mov);
                switch(mov) {
                case 1:
                  pm1();
                  pm1();
                  pm1();
                  pm1();
                  pm1();
                  pm1();
                  pm1();
                break;
                case 2:
                  pm2();
                  pm2();
                  pm2();
                  pm2();
                  pm2();
                  pm2();
                  pm2();
                break;
                case 3:
                  pm3();
                  pm3();
                  pm3();
                  pm3();
                  pm3();
                  pm3();
                  pm3();
                break;
                case 4:
                  pm4();
                  pm4();
                  pm4();
                  pm4();
                  pm4();
                  pm4();
                  pm4();
                 
                break;
                case 5:
                  pm5();
                  pm5();
                  pm5();
                  pm5();
                  pm5();
                  pm5();
                  pm5();
                  
                break;
                case 6:
                  pm6();
                  pm6();
                  pm6();
                  pm6();
                  pm6();
                  pm6();
                  pm6();
                  
                break;
                case 7:
                  pm7();
                  pm7();
                  pm7();
                  pm7();
                  pm7();
                  pm7();
                  pm7();
                  
                break;
                case 8:
                  pm8();
                  pm8();
                  pm8();
                  pm8();
                  pm8();
                  pm8();
                  pm8();
                 
                break;
                case 9:
                  pm9();
                  pm9();
                  pm9();
                  pm9();
                  pm9();
                  pm9();
                  pm9();
                  
                break;
              }
}

function pm1() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n1 = n5;
  n5 = n4;
  n4 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm2() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n2 = n1;
  n1 = n4;
  n4 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n5;
  n5 = n2;
  $("#p1").html(n1);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm3() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n5;
  n5 = n3;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm4() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n4 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n5;
  n5 = n4;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}
function pm5() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n5 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n5;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm6() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n6 = n5;
  n5 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n7;
  n7 = n8;
  n8 = n9;
  n9 = n6;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p7").html(n7);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm7() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n7 = n5;
  n5 = n8;
  n8 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n7;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p8").html(n8);
  $("#p9").html(n9);
}

function pm8() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n8 = n5;
  n5 = n9;
  n9 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n7;
  n7 = n8;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p9").html(n9);
}

function pm9() {
  n1 = $("#p1").text();
  n2 = $("#p2").text();
  n3 = $("#p3").text();
  n4 = $("#p4").text();
  n5 = $("#p5").text();
  n6 = $("#p6").text();
  n7 = $("#p7").text();
  n8 = $("#p8").text();
  n9 = $("#p9").text();
  n9 = n5;
  n5 = n6;
  n6 = n3;
  n3 = n2;
  n2 = n1;
  n1 = n4;
  n4 = n7;
  n7 = n8;
  n8 = n9;
  $("#p1").html(n1);
  $("#p2").html(n2);
  $("#p3").html(n3);
  $("#p4").html(n4);
  $("#p5").html(n5);
  $("#p6").html(n6);
  $("#p7").html(n7);
  $("#p8").html(n8);
}

$(function () {
  main();
});


