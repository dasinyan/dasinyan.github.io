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
  var mov = $("#kotae2").text();
  var flinput = $("#flinput").text(); 

$('.panel').click(function() {
  flinput = $("#flinput").text();
  switch(flinput) {
    case "0":
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
    break;
    case "1":
      switch($(this).attr("id")) {
        case "p1":
           n1 = $("#p1").text();
           switch(n1) {
             case "1":
               n1 = 2;
               $("#p1").html(n1);
             break; 
             case "2":
               n1 = 3;
               $("#p1").html(n1);
             break;
             case "3":
               n1 = 4;
               $("#p1").html(n1);
             break;
             case "4":
               n1 = 5;
               $("#p1").html(n1);
             break;
             case "5":
               n1 = 6;
               $("#p1").html(n1);
             break;
             case "6":
               n1 = 7;
               $("#p1").html(n1);
             break;
             case "7":
               n1 = 8;
               $("#p1").html(n1);
             break;
             case "8":
               n1 = 9;
               $("#p1").html(n1);
             break;
             case "9":
               n1 = 1;
               $("#p1").html(n1);
             break;
           } 
        break;
        case "p2":
           n2 = $("#p2").text();
           switch(n2) {
             case "1":
               n2 = 2;
               $("#p2").html(n2);
             break; 
             case "2":
               n2 = 3;
               $("#p2").html(n2);
             break;
             case "3":
               n2 = 4;
               $("#p2").html(n2);
             break;
             case "4":
               n2 = 5;
               $("#p2").html(n2);
             break;
             case "5":
               n2 = 6;
               $("#p2").html(n2);
             break;
             case "6":
               n2 = 7;
               $("#p2").html(n2);
             break;
             case "7":
               n2 = 8;
               $("#p2").html(n2);
             break;
             case "8":
               n2 = 9;
               $("#p2").html(n2);
             break;
             case "9":
               n2 = 1;
               $("#p2").html(n2);
             break;
           } 
        break;
        case "p3":
           n3 = $("#p3").text();
           switch(n3) {
             case "1":
               n3 = 2;
               $("#p3").html(n3);
             break; 
             case "2":
               n3 = 3;
               $("#p3").html(n3);
             break;
             case "3":
               n3 = 4;
               $("#p3").html(n3);
             break;
             case "4":
               n3 = 5;
               $("#p3").html(n3);
             break;
             case "5":
               n3 = 6;
               $("#p3").html(n3);
             break;
             case "6":
               n3 = 7;
               $("#p3").html(n3);
             break;
             case "7":
               n3 = 8;
               $("#p3").html(n3);
             break;
             case "8":
               n3 = 9;
               $("#p3").html(n3);
             break;
             case "9":
               n3 = 1;
               $("#p3").html(n3);
             break;
           } 
        break;
        case "p4":
           n4 = $("#p4").text();
           switch(n4) {
             case "1":
               n4 = 2;
               $("#p4").html(n4);
             break; 
             case "2":
               n4 = 3;
               $("#p4").html(n4);
             break;
             case "3":
               n4 = 4;
               $("#p4").html(n4);
             break;
             case "4":
               n4 = 5;
               $("#p4").html(n4);
             break;
             case "5":
               n4 = 6;
               $("#p4").html(n4);
             break;
             case "6":
               n4 = 7;
               $("#p4").html(n4);
             break;
             case "7":
               n4 = 8;
               $("#p4").html(n4);
             break;
             case "8":
               n4 = 9;
               $("#p4").html(n4);
             break;
             case "9":
               n4 = 1;
               $("#p4").html(n4);
             break;
           } 
        break;
        case "p5":
           n5 = $("#p5").text();
           switch(n5) {
             case "1":
               n5 = 2;
               $("#p5").html(n5);
             break; 
             case "2":
               n5 = 3;
               $("#p5").html(n5);
             break;
             case "3":
               n5 = 4;
               $("#p5").html(n5);
             break;
             case "4":
               n5 = 5;
               $("#p5").html(n5);
             break;
             case "5":
               n5 = 6;
               $("#p5").html(n5);
             break;
             case "6":
               n5 = 7;
               $("#p5").html(n5);
             break;
             case "7":
               n5 = 8;
               $("#p5").html(n5);
             break;
             case "8":
               n5 = 9;
               $("#p5").html(n5);
             break;
             case "9":
               n5 = 1;
               $("#p5").html(n5);
             break;
           } 
        break;
        case "p6":
           n6 = $("#p6").text();
           switch(n6) {
             case "1":
               n6 = 2;
               $("#p6").html(n6);
             break; 
             case "2":
               n6 = 3;
               $("#p6").html(n6);
             break;
             case "3":
               n6 = 4;
               $("#p6").html(n6);
             break;
             case "4":
               n6 = 5;
               $("#p6").html(n6);
             break;
             case "5":
               n6 = 6;
               $("#p6").html(n6);
             break;
             case "6":
               n6 = 7;
               $("#p6").html(n6);
             break;
             case "7":
               n6 = 8;
               $("#p6").html(n6);
             break;
             case "8":
               n6 = 9;
               $("#p6").html(n6);
             break;
             case "9":
               n6 = 1;
               $("#p6").html(n6);
             break;
           } 
        break;
        case "p7":
           n7 = $("#p7").text();
           switch(n7) {
             case "1":
               n7 = 2;
               $("#p7").html(n7);
             break; 
             case "2":
               n7 = 3;
               $("#p7").html(n7);
             break;
             case "3":
               n7 = 4;
               $("#p7").html(n7);
             break;
             case "4":
               n7 = 5;
               $("#p7").html(n7);
             break;
             case "5":
               n7 = 6;
               $("#p7").html(n7);
             break;
             case "6":
               n7 = 7;
               $("#p7").html(n7);
             break;
             case "7":
               n7 = 8;
               $("#p7").html(n7);
             break;
             case "8":
               n7 = 9;
               $("#p7").html(n7);
             break;
             case "9":
               n7 = 1;
               $("#p7").html(n7);
             break;
           } 
        break;
        case "p8":
           n8 = $("#p8").text();
           switch(n8) {
             case "1":
               n8 = 2;
               $("#p8").html(n8);
             break; 
             case "2":
               n8 = 3;
               $("#p8").html(n8);
             break;
             case "3":
               n8 = 4;
               $("#p8").html(n8);
             break;
             case "4":
               n8 = 5;
               $("#p8").html(n8);
             break;
             case "5":
               n8 = 6;
               $("#p8").html(n8);
             break;
             case "6":
               n8 = 7;
               $("#p8").html(n8);
             break;
             case "7":
               n8 = 8;
               $("#p8").html(n8);
             break;
             case "8":
               n8 = 9;
               $("#p8").html(n8);
             break;
             case "9":
               n8 = 1;
               $("#p8").html(n8);
             break;
           } 
        break;
        case "p9":
           n9 = $("#p9").text();
           switch(n9) {
             case "1":
               n9 = 2;
               $("#p9").html(n9);
             break; 
             case "2":
               n9 = 3;
               $("#p9").html(n9);
             break;
             case "3":
               n9 = 4;
               $("#p9").html(n9);
             break;
             case "4":
               n9 = 5;
               $("#p9").html(n9);
             break;
             case "5":
               n9 = 6;
               $("#p9").html(n9);
             break;
             case "6":
               n9 = 7;
               $("#p9").html(n9);
             break;
             case "7":
               n9 = 8;
               $("#p9").html(n9);
             break;
             case "8":
               n9 = 9;
               $("#p9").html(n9);
             break;
             case "9":
               n9 = 1;
               $("#p9").html(n9);
             break;
           } 
        break; 
      }
    break;

  } 
});

$('.bot').click(function() {

    tes = $("#tebo").text();
   
    switch($(this).attr("id")) {
      case "tebo":
        flinput = $("#flinput").text();
        switch(flinput) {
          case "0":
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
         }
      break;
      case "sebo":
        flinput = $("#flinput").text();
        switch(flinput) {
          case "0":
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
        }
          
      break;
      case "resebo":
        flinput = $("#flinput").text();
        switch(flinput) {
          case "0":
             rmem();
          break;
        }
         rmem(); 
      break;
      case "input":
        flinput = $("#flinput").text();
        switch (flinput) {
          case "0":
            flinput = 1;
            $("#flinput").html(1);
            $("#hyouji").html("Input mode");
            tebo = 0;
            $("#tebo").html(0);
            $("#kotae").html("none");
          break;
          case "1":
            n1 = $("#p1").text();
            n2 = $("#p2").text();
            n3 = $("#p3").text();
            n4 = $("#p4").text();
            n5 = $("#p5").text();
            n6 = $("#p6").text();
            n7 = $("#p7").text();
            n8 = $("#p8").text();
            n9 = $("#p9").text();
            if (n1==n2||n1==n3||n1==n4||n1==n5||n1==n6||n1==n7||n1==n8||n1==n9||
                        n2==n3||n2==n4||n2==n5||n2==n6||n2==n7||n2==n8||n2==n9||
                                n3==n4||n3==n5||n3==n6||n3==n7||n3==n8||n3==n9||
                                        n4==n5||n4==n6||n4==n7||n4==n8||n4==n9||
                                                n5==n6||n5==n7||n5==n8||n5==n9||
                                                        n6==n7||n6==n8||n6==n9||
                                                                n7==n8||n8==n9||
                                                                        n8==n9) {
            set0()
            }
            flinput = 0;
            $("#flinput").html(0);
            $("#hyouji").html("Let's Try");
            wmem()
          break;
        }
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
  } else {
    $("#hyouji").html("Let's Try");
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


