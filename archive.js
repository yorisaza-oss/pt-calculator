
const SUPABASE_URL = "https://eqkkdokzeamqyegmbbid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fXpQkRCHfrUtSOVLh03bVA_R-7NSY5G";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const statusElement = document.getElementById("archive-status");
const contentElement = document.getElementById("archive-content");

async function loadArchive() {
    statusElement.textContent = "アーカイブを読み込んでいます……";

    const { data, error } = await supabaseClient
        .from("cast_final_results")
        .select("event_day, cast_name, final_border_1_percent, total_player_at, recorded_at, note")
        .order("event_day", { ascending: true })
        .order("cast_name", { ascending: true });

    if (error) {
        console.error("アーカイブ取得エラー:", JSON.stringify(error, null, 2));
        statusElement.textContent =
            "記録を読み込めませんでした。時間をおいて再度お試しください";
        return;
    }

    if (!data || data.length === 0) {
        statusElement.textContent = "現在、表示できる記録がありません";
        return;
    }

    const formatPt = (value) => {
        if (value === null || value === undefined) {
            return "未記録";
        }
        return `${Number(value).toLocaleString("ja-JP")} pt`;
    };


contentElement.replaceChildren();

const days = new Map();

for (const record of data) {
    if (!days.has(record.event_day)) {
        days.set(record.event_day, []);
    }
    days.get(record.event_day).push(record);
}

for (const [day, records] of days) {
    const daySection = document.createElement("section");
    daySection.className = "archive-day";

    const dayHeading = document.createElement("h2");
    dayHeading.className = "archive-day-heading";
    dayHeading.textContent =
        `DAY ${String(day).padStart(2, "0")}　${day}日目`;

    const cardGrid = document.createElement("div");
    cardGrid.className = "archive-card-grid";

    for (const record of records) {
        const card = document.createElement("article");
        card.className = "archive-card";

        const heading = document.createElement("h3");
        heading.className = "archive-card-heading";
        heading.textContent = record.cast_name;

        const borderLabel = document.createElement("p");
        borderLabel.className = "archive-metric-label";
        borderLabel.textContent = "最終1％ボーダー";

        const borderValue = document.createElement("p");
        borderValue.className = "archive-metric-value";
        borderValue.textContent =
            formatPt(record.final_border_1_percent);

        const totalLabel = document.createElement("p");
        totalLabel.className = "archive-metric-label";
        totalLabel.textContent = "全プレイヤーの総合pt";

        const totalValue = document.createElement("p");
        totalValue.className = "archive-metric-value";
        totalValue.textContent =
            formatPt(record.total_player_at);

        card.append(
            heading,
            borderLabel,
            borderValue,
            totalLabel,
            totalValue
        );

        if (record.recorded_at) {
            const dateLabel = document.createElement("p");
            dateLabel.className = "archive-recorded-at";
            dateLabel.textContent =
                `記録日時：${new Date(record.recorded_at).toLocaleString("ja-JP")}`;
            card.append(dateLabel);
        }

        if (record.note) {
            const noteLabel = document.createElement("p");
            noteLabel.className = "archive-note";
            noteLabel.textContent = `備考：${record.note}`;
            card.append(noteLabel);
        }

        cardGrid.append(card);
    }

    daySection.append(dayHeading, cardGrid);
    contentElement.append(daySection);
}
