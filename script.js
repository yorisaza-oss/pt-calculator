"use strict";

const SUPABASE_URL = "https://eqkkdokzeamqyegmbbid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fXpQkRCHfrUtSOVLh03bVA_R-7NSY5G";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// =========================
// イベント日ごとのキャスト
// =========================

const eventCasts = {
    1: ["クー", "マイカ"],
    2: ["銀星", "シン"],
    3: ["ミズキ", "リンドウ"],
    4: ["吉野", "玻璃"],
    5: ["ギィ", "ネコメ"],
    6: ["メノウ", "ヒナタ"],
    7: ["柘榴", "大牙"],
    8: ["リコ", "鷹見"],
    9: ["ソテツ", "藍"],
    10: ["ヒース", "晶"],
    11: ["夜光", "モクレン"],
    12: ["カスミ", "金剛"],
    13: ["真珠", "青桐"],
    14: ["黒曜", "ケイ"]
};

// =========================
// イベント設定
// =========================

// Day 1 開始日時
const EVENT_START =
    new Date("2026-10-01T18:00:00+09:00");

const EVENT_DAY2_START =
    new Date("2026-10-02T15:00:00+09:00");
// Day 2以降の切り替え時刻
const EVENT_DAY_START_HOUR = 15;
// =========================
// 現在のイベント日を取得
// =========================

function getCurrentEventDay() {
    const now = new Date();

    if (now < EVENT_START) {
        return null;
    }

    if (now < EVENT_DAY2_START) {
        return 1;
    }

    const elapsed =
        now.getTime() - EVENT_DAY2_START.getTime();

    const oneDay =
        24 * 60 * 60 * 1000;

    const eventDay =
        Math.floor(elapsed / oneDay) + 2;

    return eventDay <= 14 ? eventDay : null;
}

// =========================
// 各イベント日・キャストの最新データを取得
// =========================

function getLatestBorders(data) {
    const latestByDayAndCast = {};

    for (const border of data) {
        const key =
            `${border.event_day}_${border.cast_name}`;

        if (!latestByDayAndCast[key]) {
            latestByDayAndCast[key] = border;
        }
    }

    return latestByDayAndCast;
}

function formatBorderPoint(value) {
    if (value === null || value === undefined || value === "") {
        return "---";
    }

    return `${Number(value).toLocaleString("ja-JP")} pt`;
}

function formatBorderTime(border) {
    if (!border) {
        return "更新：---";
    }

    const observedDate = new Date(border.observed_at);

    return `更新：${observedDate.toLocaleString("ja-JP")}`;
}

function getLatestPercentBorder(data, eventDay, castName, field) {
    return data.find(border =>
        border.event_day === eventDay &&
        border.cast_name === castName &&
        border[field] !== null &&
        border[field] !== undefined &&
        border[field] !== ""
    );
}


function updateHomeBorder() {
    const ids = [
        ["border-day", "home-border-day"],
        ["border-cast-1", "home-border-cast-1"],
        ["border-point-1", "home-border-point-1"],
        ["border-cast-2", "home-border-cast-2"],
        ["border-point-2", "home-border-point-2"]
    ];

    for (const [sourceId, targetId] of ids) {
        $(targetId).textContent =
            $(sourceId).textContent;
    }

    const time1 = $("border-time-1").textContent;
    const time2 = $("border-time-2").textContent;

    const times = [time1, time2]
        .filter(time => time.startsWith("更新："))
        .map(time => time.replace("更新：", ""));

    $("home-border-time").textContent =
        times.length > 0
            ? `更新：${times.join(" ／ ")}`
            : time1;
}


async function loadBorders() {
    const { data, error } = await supabaseClient
        .from("borders")
        .select("*")
        .order("event_day", { ascending: false })
        .order("observed_at", { ascending: false });

    const historyList =
        document.getElementById("history-list");

    // Supabaseから取得できなかった場合
    if (error) {
        console.error("Supabase error:", error);

        historyList.innerHTML =
            "<p>ボーダーデータを取得できませんでした。</p>";

        return;
    }

    // ボーダーデータが1件もない場合
    if (data.length === 0) {
       
        historyList.innerHTML =
            "<p>まだボーダーの記録がありません。</p>";

        return;
    }

    // 各イベント日・キャストについて、
    // 最新の記録だけを取得
    const latestByDayAndCast =
        getLatestBorders(data);

    const currentEventDay =
        getCurrentEventDay();

    /*
     * 現在のイベント日の表示
     */
    if (currentEventDay === null) {

        // イベント期間外
        document.getElementById("border-day").textContent =
            "イベント期間外";

        document.getElementById("border-cast-1").textContent =
            "BLACK：---";

        document.getElementById("border-cast-2").textContent =
            "STAR：---";

        document.getElementById("border-point-1").textContent =
            "---";

        document.getElementById("border-point-2").textContent =
            "---";

        document.getElementById("border-time-1").textContent =
            "イベント開催中に表示されます";

        document.getElementById("border-time-2").textContent =
            "イベント開催中に表示されます";

                    // イベント期間外は、2%・3%の表示もリセットする
        [
            "border-point-2-percent-1",
            "border-point-3-percent-1",
            "border-point-2-percent-2",
            "border-point-3-percent-2"
        ].forEach(id => {
            document.getElementById(id).textContent = "---";
        });

        [
            "border-time-2-percent-1",
            "border-time-3-percent-1",
            "border-time-2-percent-2",
            "border-time-3-percent-2"
        ].forEach(id => {
            document.getElementById(id).textContent =
                "イベント開催中に表示されます";
        });

    } else {

        // イベント期間中
        const currentCasts =
            eventCasts[currentEventDay];

        document.getElementById("border-day").textContent =
            `イベント${currentEventDay}日目`;

        const currentDayBorders =
            Object.values(latestByDayAndCast)
                .filter(
                    border =>
                        border.event_day === currentEventDay
                );

        currentDayBorders.sort(
            (a, b) =>
                new Date(b.observed_at) -
                new Date(a.observed_at)
        );

        const cast1Name =
            currentCasts[0];

        const cast2Name =
            currentCasts[1];

        document.getElementById("border-cast-1").textContent =
            `BLACK：${cast1Name}`;

        document.getElementById("border-cast-2").textContent =
            `STAR：${cast2Name}`;

        /*
         * キャスト1
         */
        const cast1 =
            currentDayBorders.find(
                border =>
                    border.cast_name === cast1Name
            );

        if (cast1) {

            document.getElementById("border-point-1").textContent =
                `${cast1.border_1_percent.toLocaleString()} pt`;

            const observedDate1 =
                new Date(cast1.observed_at);

            document.getElementById("border-time-1").textContent =
                `更新：${observedDate1.toLocaleString("ja-JP")}`;

        } else {

            document.getElementById("border-point-1").textContent =
                "---";

            document.getElementById("border-time-1").textContent =
                "更新：データなし";
        }

        // キャスト1の2%・3%ボーダーと、それぞれの最新記録
        const cast1Two = getLatestPercentBorder(
            data, currentEventDay, cast1Name, "border_2_percent"
        );

        const cast1Three = getLatestPercentBorder(
            data, currentEventDay, cast1Name, "border_3_percent"
        );

        document.getElementById("border-point-2-percent-1").textContent =
            formatBorderPoint(cast1Two?.border_2_percent);

        document.getElementById("border-time-2-percent-1").textContent =
            formatBorderTime(cast1Two);

        document.getElementById("border-point-3-percent-1").textContent =
            formatBorderPoint(cast1Three?.border_3_percent);

        document.getElementById("border-time-3-percent-1").textContent =
            formatBorderTime(cast1Three);
        /*
         * キャスト2
         */
        const cast2 =
            currentDayBorders.find(
                border =>
                    border.cast_name === cast2Name
            );

        if (cast2) {

            document.getElementById("border-point-2").textContent =
                `${cast2.border_1_percent.toLocaleString()} pt`;

            const observedDate2 =
                new Date(cast2.observed_at);

            document.getElementById("border-time-2").textContent =
                `更新：${observedDate2.toLocaleString("ja-JP")}`;

        } else {

            document.getElementById("border-point-2").textContent =
                "---";

            document.getElementById("border-time-2").textContent =
                "更新：データなし";
        }

                // キャスト2の2%・3%ボーダーと、それぞれの最新記録
        const cast2Two = getLatestPercentBorder(
            data, currentEventDay, cast2Name, "border_2_percent"
        );

        const cast2Three = getLatestPercentBorder(
            data, currentEventDay, cast2Name, "border_3_percent"
        );

        document.getElementById("border-point-2-percent-2").textContent =
            formatBorderPoint(cast2Two?.border_2_percent);

        document.getElementById("border-time-2-percent-2").textContent =
            formatBorderTime(cast2Two);

        document.getElementById("border-point-3-percent-2").textContent =
            formatBorderPoint(cast2Three?.border_3_percent);

        document.getElementById("border-time-3-percent-2").textContent =
            formatBorderTime(cast2Three);

    /*
     * 過去のボーダー履歴
     */
    historyList.innerHTML = "";

    const days = [
        ...new Set(
            Object.values(latestByDayAndCast)
                .map(border => border.event_day)
        )
    ].sort((a, b) => b - a);

    for (const day of days) {

        const casts =
            Object.values(latestByDayAndCast)
                .filter(
                    border =>
                        border.event_day === day
                );

        const dayTitle =
            document.createElement("h4");

        dayTitle.textContent =
            `Day ${day}`;

        historyList.appendChild(dayTitle);

        for (const border of casts) {

            const item =
                document.createElement("div");

            item.className =
                "history-item";

            const castName = document.createElement("span");
            castName.className = "history-day";
            castName.textContent = border.cast_name;

            const point = document.createElement("span");
            point.className = "history-point";
            point.textContent =
                `${border.border_1_percent.toLocaleString()} pt`;

             

            item.appendChild(castName);
            item.appendChild(point);

            historyList.appendChild(item);
        }
    }
}
   updateHomeBorder();
}

loadBorders();

document
    .getElementById("save-border-button")
    .addEventListener("click", saveBorder);


async function saveBorder() {

    const button =
        document.getElementById("save-border-button");

    const message =
        document.getElementById("save-message");

    // 二重クリック防止
    if (button.disabled) {
        return;
    }

    button.disabled = true;

    try {

        const eventDay = Number(
            document.getElementById("input-event-day").value
        );

        const castName =
            document.getElementById("input-cast-name").value.trim();

        const borderInput =
            document.getElementById("input-border");

        const borderValue =
            borderInput.value.trim();

        const borderPoint =
            Number(borderValue);

        const border2Value =
            document.getElementById("input-border-2").value.trim();

        const border3Value =
            document.getElementById("input-border-3").value.trim();

        const border2Point =
            border2Value === "" ? null : Number(border2Value);

        const border3Point =
            border3Value === "" ? null : Number(border3Value);

            console.log("2%入力値:", border2Value);
            console.log("3%入力値:", border3Value);
            console.log("保存する2%:", border2Point);
            console.log("保存する3%:", border3Point);
        /*
         * 入力チェック
         */

        if (eventDay < 1 || eventDay > 14) {
            message.textContent =
                "イベント日は1～14で入力してください。";
            return;
        }

        if (castName === "") {
            message.textContent =
                "キャストを選択してください。";
            return;
        }

        if (
            borderValue === "" ||
            !Number.isInteger(borderPoint) ||
            borderPoint < 1||
            borderPoint > 20000000
        ) {
            message.textContent =
                "1%ボーダーは1以上の整数で入力してください。";
            return;
        }


        if (
            (border2Value !== "" &&
                (!Number.isInteger(border2Point) ||
                border2Point < 1 ||
                border2Point > 20000000)) ||
            (border3Value !== "" &&
                (!Number.isInteger(border3Point) ||
                border3Point < 1 ||
                border3Point > 20000000))
        ) {
            message.textContent =
                "2%・3%ボーダーは、空欄または1以上の整数で入力してください。";
            return;
        }
                /*
         * Supabaseへ保存
         */

        const { data, error } =
            await supabaseClient
                .from("borders")
                .insert({
                    event_day: eventDay,
                    cast_name: castName,
                    border_1_percent: borderPoint,
                    border_2_percent: border2Point,
                    border_3_percent: border3Point
                })
                .select();

        if (error) {
            console.error("保存エラー:", error);

            message.textContent =
                "保存に失敗しました。";

            return;
        }

        message.textContent =
            "ボーダーを記録しました。";

        /*
         * 入力欄をクリア
         */

        document.getElementById(
            "input-cast-name"
        ).value = "";

        document.getElementById(
            "input-border"
        ).value = "";

        document.getElementById("input-border-2").value = "";
        
        document.getElementById("input-border-3").value = "";
        /*
         * 最新データを再取得
         */

        await loadBorders();

    } finally {

        // 成功・失敗・入力エラーの
        // どの場合でもボタンを再び有効にする
        button.disabled = false;
    }
}

// =========================
// イベント日変更時に
// キャスト選択肢を更新
// =========================

document
    .getElementById("input-event-day")
    .addEventListener("change", updateCastOptions);


function updateCastOptions() {

    const eventDay = Number(
        document.getElementById("input-event-day").value
    );

    const castSelect =
        document.getElementById("input-cast-name");

    // 一度、選択肢を空にする
    castSelect.innerHTML = "";

    // 初期メッセージ
    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent =
        "キャストを選択してください";

    castSelect.appendChild(defaultOption);


    // 該当日のキャストを取得
    const casts = eventCasts[eventDay];

    if (!casts) {
        return;
    }


    // キャストを追加
    for (const cast of casts) {

        const option =
            document.createElement("option");

        option.value = cast;
        option.textContent = cast;

        castSelect.appendChild(option);
    }
}
updateCastOptions();

function initializeEventDay() {
    const currentEventDay = getCurrentEventDay();

    if (currentEventDay === null) {
        return;
    }

    const daySelect =
        document.getElementById("input-event-day");

    daySelect.value = String(currentEventDay);

    updateCastOptions();
}

initializeEventDay();

/* ---------- 画面切り替え ---------- */
const screens = ["home", "calc", "goal", "border"];

function route() {
  const name = location.hash.slice(1);
  const current = screens.includes(name) ? name : "home";

  screens.forEach((s) => {
    $(s).hidden = s !== current;
  });

  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);

function calcBattle() {
  const lv = num("lv", 0);
  const scoreEmpty = $("score").value.trim() === "";
  const score = num("score", 0);
  const chip = Math.floor(num("chip", 0, 30));
  const isDouble = $("double").checked;

  const play = 500 + lv * 10;
  const formation = $("target").checked ? PT.target : 0;
  const bonus = $("special").checked ? PT.special : 0;
  const chipPt = chip * PT.chip;

    // -------------------------
    // 合計
    // -------------------------


  const subtotal =
    play +
    score +
    formation +
    bonus +
    chipPt;

  const final = isDouble ? subtotal * 2 : subtotal;

    // -------------------------
    // 明細表示
    // -------------------------

  const rows = [
    ["公演プレイ", fmt(play) + "pt"],
    ["公演スコア", scoreEmpty ? "未入力" : fmt(score) + "pt", scoreEmpty],
    ["公演編成", fmt(formation) + "pt"],
    ["対決ボーナス", fmt(bonus) + "pt"],
    ["チップ", fmt(chipPt) + "pt"],
    ["小計", fmt(subtotal) + "pt"],
    ["2倍", isDouble ? "×2" : "なし", !isDouble],
  ];

  $("rows").innerHTML =
    rows
      .map(
        ([k, v, muted]) =>
          `<div class="row${muted ? " is-muted" : ""}"><dt>${k}</dt><dd>${v}</dd></div>`
      )
      .join("") +
    `<div class="row total"><dt>最終獲得対決pt</dt><dd>${fmt(final)}pt</dd></div>`;

    // -------------------------
    // 最終結果
    // -------------------------

  $("finalLabel").textContent = scoreEmpty
    ? "合計獲得対決pt"
    : "今回の獲得対決pt";

  $("finalPt").textContent = fmt(final);

  $("finalNote").textContent = scoreEmpty
    ? "公演スコアptを除いたptの算出ができます"
    : "";
}


/* ---------- 目標pt計算 ---------- */

function calcNeed() {
  const cur = num("cur");
  const tgt = num("tgt");
  const low = num("perLow");
  const high = num("perHigh");

  // これから獲得するフラスタ・アクセの数
  const flasta = Math.floor(num("flasta", 0));
  const acce = Math.floor(num("acce", 0));

  // フラスタ・アクセで獲得できるpt
  const giftPt =
    flasta * PT.flasta +
    acce * PT.acce;

  // 現在のptから目標までの残り
  const remain = Math.max(0, tgt - cur);

  // ギフト分を差し引いた後の残りpt
  const remainAfterGift = Math.max(0, remain - giftPt);

  if (remain === 0) {
    $("needRange").textContent = "0";
    $("needNote").textContent =
      "目標に到達しています";
    return { fewer: 0, more: 0, ptLeft: 0 };
  }

  // フラスタ・アクセだけで目標に届く場合
  if (remainAfterGift === 0) {
    $("needRange").textContent = "0";
    $("needNote").textContent =
      `ギフトで ${fmt(giftPt)}pt 獲得できます`;
    return { fewer: 0, more: 0, ptLeft: 0 };
  }

  if (low <= 0 || high <= 0) {
    $("needRange").textContent = "-";
    $("needNote").textContent =
        "チケポ消費2倍・1回の獲得ptを入力してください"
    return null;
  }

  // 獲得ptが多い方が少ない枚数で済むため、
  // 上限→少、下限→多
    
    const lo = Number(perLow.value);
    const hi = Number(perHigh.value);

    const fewerBattles = Math.ceil(remainAfterGift / hi);
    const moreBattles = Math.ceil(remainAfterGift / lo);

    const fewer = fewerBattles * 2;
    const more = moreBattles * 2;

  $("needRange").textContent =
    fewer === more
      ? fmt(fewer)
      : `${fmt(fewer)}〜${fmt(more)}`;

  $("needNote").textContent =
    `残り ${fmt(remain)}pt ／ ギフト +${fmt(giftPt)}pt →  ${fmt(remainAfterGift)}pt`;

  return { fewer, more, ptLeft: remainAfterGift };
}

/* ---------- 対決pt計算 ---------- */

const PT = {
  chip: 100,
  flasta: 10000,
  acce: 5000,
  target: 100,
  special: 200
};

/* ---------- チケポ・時間 ---------- */

const TICKET = {
  recoverMin: 20, // 自然回復：20分に1枚
  item: 5         // 回復アイテム：1個で5枚回復
};

/* ---------- ダイヤ ---------- */

const DIAMOND = {
  flasta: 200,       // フラスタ購入
  acce: 100,         // アクセ購入
  recover: 100,      // チケポ回復（5枚）
  flastaPerDay: 10,  // フラスタ：1日10回まで
  flastaGapMin: 20,  // フラスタ：購入間隔20分
  resetHour: 5       // フラスタ：購入数が5:00にリセット
};

// 必要チケポ（calcNeedの結果）。計算できないときは null
let need = null;

// 残り時間（分）を返す。自動：現在時刻から次の14:59（=15:00直前）まで
function getRemain() {
  const auto = document.querySelector('input[name="tkMode"]:checked').value === "auto";
  $("tkManual").hidden = auto;
  $("tkAutoNote").hidden = !auto;

  if (!auto) {
    const total = Math.floor(num("tkHour", 0)) * 60 + Math.floor(num("tkMin", 0, 59));
    const start = new Date();
    start.setHours(15, 0, 0, 0); // 手入力は開始を15:00として扱う
    return { total, auto, start };
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(15, 0, 0, 0);
  if (now >= end) end.setDate(end.getDate() + 1);

  const last = new Date(end.getTime() - 60000); // 14:59
  $("tkAutoNote").textContent = `終了：${last.getMonth() + 1}/${last.getDate()} 14:59（端末の現在時刻で計算）`;
  return { total: Math.floor((end - now) / 60000), auto, start: now };
}

function calcTicket() {
  const have = Math.floor(num("tkNow", 0));
  const { total, start } = getRemain();
  const hour = Math.floor(total / 60);
  const min = total % 60;

  const natural = Math.floor(total / TICKET.recoverMin);
  const available = have + natural;

  const rows = [
    ["現在のチケポ", fmt(have) + "枚"],
    ["残り時間", `${fmt(hour)}時間${min}分`],
    ["自然回復量", "+" + fmt(natural) + "枚"],
    ["使えるチケポ", fmt(available) + "枚"],
  ];

  let verdict = "計算できません";
  let cls = "is-muted";
  let items = null;

  if (need) {
    const shortLow = Math.max(0, need.fewer - available);
    const shortHigh = Math.max(0, need.more - available);
    const itemLow = Math.ceil(shortLow / TICKET.item);
    const itemHigh = Math.ceil(shortHigh / TICKET.item);
    items = [itemLow, itemHigh];

    rows.push(
      ["必要チケポ", rng(need.fewer, need.more) + "枚"],
      ["不足チケポ", rng(shortLow, shortHigh) + "枚"],
      ["必要回復アイテム", rng(itemLow, itemHigh) + "個"]
    );

    if (need.more === 0) {
      verdict = "チケポは不要です";
      cls = "";
    } else if (shortHigh === 0) {
      verdict = "自然回復だけで足ります";
      cls = "";
    } else if (shortLow === 0) {
      verdict = "獲得ptしだいで不足します";
      cls = "is-warn";
    } else {
      verdict = "不足します";
      cls = "is-short";
    }
  } else {
    rows.push(["必要チケポ", "-"]);
  }

  $("tkRows").innerHTML =
    rows.map(([k, v]) => `<div class="row"><dt>${k}</dt><dd>${v}</dd></div>`).join("") +
    `<div class="row total ${cls}"><dt>判定</dt><dd>${verdict}</dd></div>`;

  return { total, items, start };
}

function calcDiamond({ total, items, start }) {
  const flasta = Math.floor(num("flasta", 0));
  const acce = Math.floor(num("acce", 0));
  const ownedEmpty = $("dmOwned").value.trim() === "";
  const owned = Math.floor(num("dmOwned", 0));

  const flastaDm = flasta * DIAMOND.flasta;
  const acceDm = acce * DIAMOND.acce;
  const tLow = items ? items[0] * DIAMOND.recover : 0;
  const tHigh = items ? items[1] * DIAMOND.recover : 0;
  const sumLow = flastaDm + acceDm + tLow;
  const sumHigh = flastaDm + acceDm + tHigh;

  const rows = [
    [`フラスタ ${fmt(flasta)}個`, fmt(flastaDm) + "ダイヤ"],
    [`アクセ ${fmt(acce)}個`, fmt(acceDm) + "ダイヤ"],
    [
      items ? `チケポ回復 ${rng(items[0], items[1])}個` : "チケポ回復",
      items ? rng(tLow, tHigh) + "ダイヤ" : "-",
    ],
  ];

  const sumRow = ["必要ダイヤ", rng(sumLow, sumHigh) + "ダイヤ"];
  let html = rows.map(([k, v]) => `<div class="row"><dt>${k}</dt><dd>${v}</dd></div>`).join("");

  if (ownedEmpty) {
    html += `<div class="row total"><dt>${sumRow[0]}</dt><dd>${sumRow[1]}</dd></div>`;
  } else {
    let verdict, cls = "";
    if (owned >= sumHigh) {
      verdict = `足ります（余り ${rng(owned - sumHigh, owned - sumLow)}）`;
    } else if (owned < sumLow) {
      verdict = `${rng(sumLow - owned, sumHigh - owned)}ダイヤ不足`;
      cls = "is-short";
    } else {
      verdict = "回復枚数しだいで不足します";
      cls = "is-warn";
    }
    html +=
      `<div class="row"><dt>${sumRow[0]}</dt><dd>${sumRow[1]}</dd></div>` +
      `<div class="row total ${cls}"><dt>所持ダイヤ ${fmt(owned)}</dt><dd>${verdict}</dd></div>`;
  }
  $("dmRows").innerHTML = html;

  // フラスタの購入可能数（20分間隔・1日10個・5:00にリセット）
  const cap = flastaCap(start, total, Math.floor(num("flBought", 0)));
  const over = flasta > cap;
  $("dmNote").classList.toggle("warn", over);
  $("dmNote").textContent = over
    ? `フラスタ ${fmt(flasta)}個は、残り時間では購入しきれません（購入できるのは最大${cap}個）`
    : `フラスタは残り時間で最大${cap}個まで購入できます。`;

  // 1ダイヤあたりの獲得pt
  const lo = Math.min(num("perLow"), num("perHigh"));
  const hi = Math.max(num("perLow"), num("perHigh"));
  const per = (pt, dm) => fmt(pt / dm) + "pt";
  const recLo = lo * Math.floor(5 / 2) / DIAMOND.recover;
  const recHi = hi * Math.floor(5 / 2) / DIAMOND.recover;
  $("dmEff").innerHTML = [
    ["フラスタ", per(10000, DIAMOND.flasta)],
    ["アクセ", per(5000, DIAMOND.acce)],
    ["チケポ回復", recHi > 0 ? `${rng(recLo, recHi)}pt` : "-"],
  ].map(([k, v]) => `<div class="row"><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}

// 開始時刻から totalMin 分の間に買えるフラスタ数。5:00をまたぐたびに上限が10個ずつ増える
function flastaCap(start, totalMin, bought) {
  if (totalMin <= 0) return 0;
  const end = new Date(start.getTime() + totalMin * 60000);

  const reset = new Date(start);
  reset.setHours(DIAMOND.resetHour, 0, 0, 0);
  if (reset <= start) reset.setDate(reset.getDate() + 1);

  const edges = [start];
  while (reset < end) {
    edges.push(new Date(reset));
    reset.setDate(reset.getDate() + 1);
  }
  edges.push(end);

  let sum = 0;
  for (let i = 0; i < edges.length - 1; i++) {
    const mins = Math.floor((edges[i + 1] - edges[i]) / 60000);
    const quota = i === 0 ? Math.max(0, DIAMOND.flastaPerDay - bought) : DIAMOND.flastaPerDay;
    sum += Math.min(quota, Math.floor(mins / DIAMOND.flastaGapMin) + 1);
  }
  // 区間をまたいでも20分間隔は変わらない
  return Math.min(sum, Math.floor(totalMin / DIAMOND.flastaGapMin) + 1);
}

/* ---------- ペース ---------- */
/* ---------- 共通 ---------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString("ja-JP");

// 空欄や不正値は0、min/maxの範囲に丸める
const num = (id, min = 0, max = Infinity) => {
  const v = parseFloat($(id).value);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : 0;
};

const rng = (a, b) => (a === b ? fmt(a) : `${fmt(a)}〜${fmt(b)}`);

const d1 = (x) => (Math.round(x * 10) / 10).toLocaleString("ja-JP", { minimumFractionDigits: 1 });
const drng = (a, b) => (d1(a) === d1(b) ? d1(a) : `${d1(a)}〜${d1(b)}`);

function calcPace({ total }) {
  const hours = total / 60;
  const natural = d1(60 / TICKET.recoverMin) + "枚/時間";
  let html;

  if (!need || hours <= 0) {
    html =
      `<div class="row"><dt>自然回復</dt><dd>${natural}</dd></div>` +
      `<div class="row"><dt>1時間あたり必要チケポ</dt><dd>-</dd></div>` +
      `<div class="row total is-muted"><dt>1時間あたり必要pt</dt><dd>-</dd></div>`;
  } else {
    html =
      `<div class="row"><dt>チケポで稼ぐ分</dt><dd>${fmt(need.ptLeft)}pt</dd></div>` +
      `<div class="row"><dt>残り時間</dt><dd>${Math.floor(total / 60)}時間${total % 60}分</dd></div>` +
      `<div class="row"><dt>自然回復</dt><dd>${natural}</dd></div>` +
      `<div class="row"><dt>1時間あたり必要チケポ</dt><dd>${drng(need.fewer / hours, need.more / hours)}枚</dd></div>` +
      `<div class="row total"><dt>1時間あたり必要pt</dt><dd>${fmt(Math.ceil(need.ptLeft / hours))}pt</dd></div>`;
  }
  $("pcRows").innerHTML = html;
}

function calcGoal() {
  need = calcNeed();
  const t = calcTicket();
  calcPace(t);
  calcDiamond(t);
}

let lastEventDay =
    getCurrentEventDay();

// 自動モードでは時間が進むため、30秒ごとに再計算する
setInterval(() => {

    const currentEventDay =
        getCurrentEventDay();

    // イベント日が変わった場合
    if (currentEventDay !== lastEventDay) {

        lastEventDay =
            currentEventDay;

        initializeEventDay();
        loadBorders();
    }

    // チケット自動計算
    if (
        document.querySelector(
            'input[name="tkMode"]:checked'
        ).value === "auto"
    ) {
        calcGoal();
    }

}, 30000);


/* ---------- 初期化 ---------- */

$("calcForm").addEventListener("input", calcBattle);
$("goal").addEventListener("input", calcGoal);

calcBattle();
calcGoal();

route();
