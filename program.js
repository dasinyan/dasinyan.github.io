// ==========================================
// 1. 変数・定数定義
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycby3IYeuqZg56I100PiEuc5JGg1Uy3EfxBReYawxw6ufP3avsGvc4gSAxPNjXOoddjXe/exec";

var n1, n2, n3, n4, n5, n6, n7, n8, n9;
var sn1, sn2, sn3, sn4, sn5, sn6, sn7, sn8, sn9, stes;
var isAnimating = false; 
var saveKotae = "none";

var tempSn = Array(10).fill("");
let selectedSteps = 3; 
let isC3Mode = false; 
let inputBuffer = ""; 
let startTime = 0;

const pos = {
  1: {x: 0,   y: 0},   2: {x: 103, y: 0},   3: {x: 206, y: 0},
  4: {x: 0,   y: 103}, 5: {x: 103, y: 103}, 6: {x: 206, y: 103},
  7: {x: 0,   y: 206}, 8: {x: 103, y: 206}, 9: {x: 206, y: 206}
};

var challengeTimer = null;

let userId = localStorage.getItem("cyclogic_user_id") || (() => {
    const id = "U-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("cyclogic_user_id", id);
    return id;
})();
let currentDayOffset = 0;

// 彗星エフェクト用
let cometDelayTimer = null;
let cometInterval = null;
const cometPaths = {
  "p1": [5, 2, 3, 6, 9, 8, 7, 4], "p2": [5, 3, 6, 9, 8, 7, 4, 1], "p3": [5, 6, 9, 8, 7, 4, 1, 2],
  "p4": [5, 1, 2, 3, 6, 9, 8, 7], "p5": [2, 3, 6, 9, 8, 7, 4, 1], "p6": [5, 9, 8, 7, 4, 1, 2, 3],
  "p7": [5, 4, 1, 2, 3, 6, 9, 8], "p8": [5, 7, 4, 1, 2, 3, 6, 9], "p9": [5, 8, 7, 4, 1, 2, 3, 6]
};

// ==========================================
// 2. 音声・演出処理
// ==========================================
function playClickSound() { const s = document.getElementById("sound-click"); if (s) { s.currentTime = 0; s.play().catch(e => {}); } }
function playCompleteSound() { const s = document.getElementById("sound-complete"); if (s) { s.currentTime = 0; s.play().catch(e => {}); } }
function playChallengeVoice(steps) {
    const s = document.getElementById("sound-ch" + steps);
    if (s) { s.currentTime = 0; s.play().catch(e => playCompleteSound()); } 
    else { playCompleteSound(); }
}

function startCometLoop(panelId) {
  if (cometInterval) return;
  const path = cometPaths[panelId];
  if (!path) return;
  let step = 0;
  cometInterval = setInterval(() => {
    path.forEach(idx => $("#p" + idx).removeClass("light-1 light-2 light-3 light-4"));
    const len = path.length;
    $("#p" + path[step % len]).addClass("light-1");
    if (step >= 1) $("#p" + path[(step - 1 + len) % len]).addClass("light-2");
    if (step >= 2) $("#p" + path[(step - 2 + len) % len]).addClass("light-3");
    if (step >= 3) $("#p" + path[(step - 3 + len) % len]).addClass("light-4");
    step++;
  }, 250);
}

function stopCometLoop() {
  if (cometInterval) { clearInterval(cometInterval); cometInterval = null; }
  $(".panel").removeClass("light-1 light-2 light-3 light-4");
}

function clearEffects() {
    $(".panel").removeClass("complete-glow");
    $("#content").removeClass("victory-bg");
    $("#hyouji").css("color", "").css("text-shadow", "").html("Let's Try");
}

// ==========================================
// 3. メイン処理 & イベント
// ==========================================
function main() { 
    set0(false);
    $("#tebo").html("0");
    wmem(); 

    $('.panel').on('mouseenter touchstart', function(e) {
      if (isAnimating || isC3Mode || $("#flinput").text() === "1") return;
      const id = $(this).attr("id");
      if (cometDelayTimer) clearTimeout(cometDelayTimer);
      cometDelayTimer = setTimeout(() => {
        if (!isAnimating && !isC3Mode && $("#flinput").text() === "0") startCometLoop(id);
      }, 800);
    });

    $('.panel').on('mouseleave touchend touchcancel', function(e) {
      if (cometDelayTimer) { clearTimeout(cometDelayTimer); cometDelayTimer = null; }
      stopCometLoop();
    });

    $('.panel').click(async function() {
        stopCometLoop();
        if (isAnimating) return;

        const flinputVal = $("#flinput").text();
        const clickedNum = $(this).text();

        if (flinputVal === "1") {
            playClickSound();
            $(this).html((parseInt(clickedNum) % 9) + 1);
            return;
        }

        if (isC3Mode) {
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
                        if ($("#p" + i).text() === cmd) { targetId = i; break; }
                    }
                    if (targetId) {
                        window["pm" + targetId](false);
                        await new Promise(r => setTimeout(r, 700));
                    }
                }
                isAnimating = false;
                hantei(true);
            }
            return;
        }

        playClickSound();
        window["pm" + $(this).attr("id").replace("p", "")](false);
        setTimeout(() => hantei(true), 700);
    });

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
                prepareMode("READY?", "#f1c40f");
                isAnimating = true; 
                $("#tebo").html(selectedSteps);
                setDailyChallenge(selectedSteps); 
                if (challengeTimer) clearTimeout(challengeTimer);
                challengeTimer = setTimeout(() => {
                    $("#hyouji").html("- ".repeat(selectedSteps).trim());
                    startTime = performance.now(); 
                    isC3Mode = true; 
                    isAnimating = false; 
                    challengeTimer = null;
                }, 1000);
                break;
            case "sebo": executeSet(); break;
            case "input":
                if ($("#flinput").text() === "0") {
                    prepareMode("Input mode", "#e67e22");
                    $("#flinput").html("1");
                    $("#tebo").html("?");
                } else { executeSet(); }
                break;
            case "resebo": clearEffects(); rmem(); break;
            case "rank": openGlobalRank(); break;
        }
    });
}

// ==========================================
// 4. ロジック関数
// ==========================================
function executeSet() {
    const isInputNow = ($("#flinput").text() === "1");
    isC3Mode = false;
    inputBuffer = "";
    startTime = 0;
    $("#flinput").html("0");
    clearEffects();

    if (isInputNow) {
        if (!checkInvalid()) {
            $("#tebo").html("?"); 
            $("#kotae").text("none");
            n1=$("#p1").text(); n2=$("#p2").text(); n3=$("#p3").text();
            n4=$("#p4").text(); n5=$("#p5").text(); n6=$("#p6").text();
            n7=$("#p7").text(); n8=$("#p8").text(); n9=$("#p9").text();
        } else {
            set0(false);
            $("#tebo").html("0");
            $("#kotae").text("none");
        }
    } else {
        let teboText = $("#tebo").text();
        let loopCount = (teboText === "?" || teboText === "0") ? 0 : parseInt(teboText);
        if (loopCount === 0) {
            set0(false);
            $("#tebo").html("0");
            $("#kotae").text("none");
        } else {
            set0(false); 
            let history = [];
            for (var i = 0; i < loopCount; i++) { history.push(mset()); }
            $("#kotae").text(history.reverse().join(" "));
        }
    }
    wmem(); 
    $("#hyouji").html("Let's Try");
    reflectAllExcept(null, true); 
}

function checkInvalid() {
    var checkArr = [];
    for(var i = 1; i <= 9; i++) { checkArr.push($("#p" + i).text()); }
    for(var n = 1; n <= 9; n++) { if(!checkArr.includes(String(n))) return true; }
    return false;
}

function hantei(showCelebration) {
    var n = [];
    for (var i = 1; i <= 9; i++) { n[i] = $("#p" + i).text(); }
    const isComplete = (n[1] == "1" && n[2] == "2" && n[3] == "3" && n[4] == "4" && n[5] == "5" && n[6] == "6" && n[7] == "7" && n[8] == "8");

    if (isComplete) {
        if (showCelebration) {
            if (isC3Mode) { playChallengeVoice(selectedSteps); } else { playCompleteSound(); }
            $(".panel").addClass("complete-glow");
            $("#content").addClass("victory-bg");
            let clearTime = 0;
            if (startTime > 0) {
                clearTime = ((performance.now() - startTime) / 1000).toFixed(2);
                if (isC3Mode) {
                    $("#hyouji").html(clearTime + "s").css("color", "#2ecc71");
                    handleRanking(clearTime);
                } else {
                    $("#hyouji").html("COMPLETE!").css("color", "#2ecc71");
                }
            }
            setTimeout(() => { startTime = 0; isC3Mode = false; inputBuffer = ""; }, 1000);
        }
    } else if (isC3Mode && showCelebration && !isAnimating) {
        isAnimating = true;
        $("#hyouji").html("MISS!").css("color", "#ff4757");
        setTimeout(() => {
            for (var i = 1; i <= 9; i++) { window["n" + i] = tempSn[i]; }
            $("#hyouji").html("- ".repeat(selectedSteps).trim()).css("color", ""); 
            inputBuffer = "";
            reflectAllExcept(null, true);
            isAnimating = false; 
        }, 800);
    } else if (!isC3Mode) {
        clearEffects();
    }
}

// ==========================================
// 5. 通信・ランキング
// ==========================================
async function setDailyChallenge(steps) {
    set0(false); 
    try {
        const url = `${GAS_URL}?action=getDailySeed&steps=${steps}&dayOffset=0&userId=${userId}`;
        const response = await fetch(url);
        const data = await response.json();
        let seed = data.seed; 
        for(let i = 0; i < steps; i++) {
            seed = (seed * 9301 + 49297) % 233280;
            let move = Math.floor((seed / 233280) * 9) + 1;
            for(let j = 0; j < 7; j++) { window["pm" + move](true); }
        }
        for(var i = 1; i <= 9; i++) { tempSn[i] = $("#p" + i).text(); }
    } catch (e) { console.error("Seed Fetch Error:", e); }
}

async function handleRanking(clearTime) {
    await sendLog("postScore", selectedSteps, { time: parseFloat(clearTime) });
    setTimeout(() => { changeRankDay(0); }, 600);
}

async function sendLog(action, mode, extra = {}) {
    try {
        await fetch(GAS_URL, {
            method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, mode, userId, ...extra })
        });
    } catch (e) { console.error("Log Error:", e); }
}

function openGlobalRank() {
    currentDayOffset = 0; 
    $(".tab-btn").removeClass("active").css({"background": "", "color": ""}); 
    showGlobalRank(selectedSteps, 0); 
}

function changeRankDay(offset) {
    currentDayOffset = offset;
    $(".tab-btn").removeClass("active");
    $(`.tab-btn:eq(${offset})`).addClass("active");
    showGlobalRank(selectedSteps, offset);
}

async function showGlobalRank(steps, dayOffset = 0) {
    currentDayOffset = dayOffset;
    $("#rank-modal").fadeIn(200);
    $("#rank-list").html("<div style='padding:20px; color:#3498db;'>CONNECTING...</div>");
    
    for (let i = 0; i < 3; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const label = (i === 0) ? "TODAY" : `${d.getMonth() + 1}/${d.getDate()}`;
        const $targetTab = $(`.tab-btn:eq(${i})`);
        $targetTab.text(label);
        if (i === currentDayOffset) $targetTab.addClass("active");
        else $targetTab.removeClass("active");
    }

    try {
        const url = `${GAS_URL}?action=getRanking&mode=${steps}&dayOffset=${currentDayOffset}&userId=${userId}`;
        const response = await fetch(url);
        const data = await response.json();
        let listHtml = "";
        if (!data.top5 || data.top5.length === 0) {
            listHtml = `<div style='padding:30px; color:#95a5a6;'>NO DATA<br><small>(${data.date})</small></div>`;
            $("#rank-average").html("AVERAGE: --s");
        } else {
            data.top5.forEach((s, i) => {
                listHtml += `<div class="rank-item" style="display:flex; justify-content:space-between; padding:12px 10px; border-bottom:1px dotted #555;">
                    <span style="color:#f1c40f;">${i + 1}st</span>
                    <span style="color:#ecf0f1;">${parseFloat(s).toFixed(2)}s</span>
                </div>`;
            });
            $("#rank-average").html(`AVG: <span style="color:#2ecc71;">${data.average}s</span> / PLAYS: <span style="color:#3498db;">${data.totalPlays}</span>`);
        }
        $("#rank-list").html(listHtml);
        $("#modal-title").text(`MODE: ${steps} RANK`);
    } catch (e) { $("#rank-list").html("<div style='padding:20px; color:#e74c3c;'>CONNECTION ERROR</div>"); }
}

// ==========================================
// 6. ユーティリティ & 互換性
// ==========================================
function reflectAllExcept(fixedId, isSilent) {
    var vals = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
    if (isSilent) {
        for (var i = 1; i <= 9; i++) {
            gsap.set("#p" + i, { x: pos[i].x, y: pos[i].y });
            $("#p" + i).text(vals[i - 1]);
        }
        isAnimating = false; return;
    }
    isAnimating = true; let movingCount = 0; let finishedCount = 0;
    for (let i = 1; i <= 9; i++) {
        let targetPanel = $("#p" + i);
        let nextPosIndex = -1;
        for (let j = 0; j < 9; j++) { if (String(vals[j]) === targetPanel.text()) { nextPosIndex = j + 1; break; } }
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
                    if (finishedCount === movingCount) isAnimating = false;
                }
            });
        } else {
            gsap.set(targetPanel, { x: pos[i].x, y: pos[i].y });
            targetPanel.text(vals[i - 1]);
        }
    }
    if (movingCount === 0) isAnimating = false;
}

function wmem() {
    sn1=$("#p1").text(); sn2=$("#p2").text(); sn3=$("#p3").text();
    sn4=$("#p4").text(); sn5=$("#p5").text(); sn6=$("#p6").text();
    sn7=$("#p7").text(); sn8=$("#p8").text(); sn9=$("#p9").text();
    stes = $("#tebo").text(); saveKotae = $("#kotae").text();
}
function rmem() {
    if (challengeTimer) { clearTimeout(challengeTimer); challengeTimer = null; }
    n1=sn1; n2=sn2; n3=sn3; n4=sn4; n5=sn5; n6=sn6; n7=sn7; n8=sn8; n9=sn9;
    $("#flinput").html("0"); isC3Mode = false; isAnimating = false; inputBuffer = ""; startTime = 0;
    $("#tebo").html(stes); $("#kotae").text(saveKotae || "none");
    $("#hyouji").html("Let's Try").css("color", ""); 
    for (var i = 1; i <= 9; i++) { $("#p" + i).text(window["n" + i]); }
    reflectAllExcept(null, true);
}
function set0(h) { n1=1; n2=2; n3=3; n4=4; n5=5; n6=6; n7=7; n8=8; n9=9; reflectAllExcept(null, true); }
function mset() { 
    var mov = Math.floor(Math.random() * 9) + 1; 
    var targetNum = $("#p" + mov).text(); 
    for(var i = 0; i < 7; i++) { window["pm" + mov](true); }
    return targetNum;
}
function prepareMode(message, color) {
    set0(false); $("#kotae").text("none"); clearEffects();
    $("#hyouji").html(message).css("color", color || "");
    inputBuffer = ""; isC3Mode = false;
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

// モーダル閉じる処理
$(document).on('click', '.close-modal, #rank-modal', function(e) {
    if (e.target === this || $(e.target).hasClass('close-modal')) { $("#rank-modal").fadeOut(200); }
});

$(function () { main(); });