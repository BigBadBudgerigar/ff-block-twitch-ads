const block_ts_suffix = (() => {
    return [...Array(64)].map(() => Math.random().toString(36)[2]).join('') + ".ts";
})();
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();
const ts_redirect_url = browser.runtime.getURL("blank.ts");

function hook_m3u(details) {
    const filter = browser.webRequest.filterResponseData(details.requestId);

    let m3u8_data = "";

    filter.ondata = event => {
        m3u8_data += decoder.decode(event.data, {
            stream: true
        })
    }

    filter.onstop = () => {
        const lines = m3u8_data.split("\n");
        let ads_found = false;
        let result = [];
        let midroll_id = null;
        let next_source_is_midroll = false;

        for (let i = 0; i < lines.length; ++i) {
            const orig_line = lines[i];
            const line = orig_line.toLowerCase();
            let skip = false;

            if (line.startsWith("#ext-x-daterange:")) {
                if (line.includes("class=\"twitch-stitched-ad\"")) {
                    if (line.includes("x-tv-twitch-ad-roll-type=\"midroll\"") || line.includes("x-tv-twitch-ad-roll-type=\"preroll\"")) {
                        next_source_is_midroll = true;
                    }

                    skip = true;
                } else if (next_source_is_midroll && line.includes("class=\"twitch-stream-source\"")) {
                    const midroll_id_match = line.match(/x-tv-twitch-stream-source=\"([^\"]+)\"/);
                    if (midroll_id_match.length > 1) {
                        midroll_id = midroll_id_match[1];
                    }
                    next_source_is_midroll = false;
                }
            } else if (line.startsWith("#extinf:")) {
                if (midroll_id && line.endsWith(midroll_id) && lines[i + 1] !== undefined) {
                    lines[i + 1] = "https://www.twitch.tv/fake/" + block_ts_suffix;
                } else if (!line.endsWith(",live")) {
                    ++i;
                    skip = true;
                }
            }

            if (skip) {
                ads_found = true;
            } else {
                result.push(orig_line);
            }
        }

        if (ads_found) {
            console.log("%o rewritten to: %o", lines, result);
        }

        filter.write(encoder.encode(result.join("\n")));
        filter.close();
    }
}

function on_before_request(details) {
    if (details.url.endsWith(".m3u8")) {
        hook_m3u(details);
    } else if (details.url.endsWith(block_ts_suffix)) {
        return {
            redirectUrl: ts_redirect_url
        };
    }
}

browser.webRequest.onBeforeRequest.addListener(
    on_before_request, {
        urls: ["*://*.ttvnw.net/*", `https://www.twitch.tv/fake/${block_ts_suffix}`]
    },
    ["blocking"]
);