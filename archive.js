
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
        .select("event_day, cast_name, final_border_1_percent, total_player_pt, recorded_at, note")
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

    for (const record of data) {
        const card = document.createElement("section");
        card.className = "archive-card";

        const heading = document.createElement("h3");
        heading.textContent = `${record.event_day}日目｜${record.cast_name}`;

        const borderLabel = document.createElement("p");
        borderLabel.textContent =
            `最終1％ボーダー：${formatPt(record.final_border_1_percent)}`;

        const totalLabel = document.createElement("p");
        totalLabel.textContent =
            `全プレイヤーの総合pt：${formatPt(record.total_player_pt)}`;

        card.append(heading, borderLabel, totalLabel);

        if (record.recorded_at) {
            const dateLabel = document.createElement("p");
            dateLabel.className = "archive-recorded-at";
            dateLabel.textContent =
                `記録日時：${new Date(record.recorded_at).toLocaleString("ja-JP")}`;
            card.append(dateLabel);
        }

        if (record.note) {
            const noteLabel = document.createElement("p");
            noteLabel.textContent = `備考：${record.note}`;
            card.append(noteLabel);
        }

        contentElement.append(card);
    }

    statusElement.textContent = `${data.length}件の記録を読み込みました。`;
}

loadArchive();
