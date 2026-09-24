const BLOCKED_DOMAINS = [
  "youtube.com",
  "instagram.com",
  "x.com",
  "facebook.com",
  "tiktok.com",
  "snapchat.com"
];

const RULE_ID_START = 1000;
const LOCK_ALARM = "maatram-hard-lock";


function createBlockingRules() {

  return BLOCKED_DOMAINS.map((domain, index) => {

    return {
      id: RULE_ID_START + index,

      priority: 100,

      action: {
        type: "redirect",

        redirect: {
          extensionPath: "/blocked.html"
        }
      },

      condition: {
        requestDomains: [domain],

        resourceTypes: [
          "main_frame"
         
       ]
      }
    };

  });

}


async function enableBlocking() {

  const rules =
    createBlockingRules();

  await chrome.declarativeNetRequest.updateDynamicRules({

    removeRuleIds:
      rules.map(rule => rule.id),

    addRules:
      rules

  });

}


async function disableBlocking() {

  const ruleIds =
    BLOCKED_DOMAINS.map(
      (_, index) =>
        RULE_ID_START + index
    );

  await chrome.declarativeNetRequest.updateDynamicRules({

    removeRuleIds:
      ruleIds,

    addRules: []

  });

}


async function startHardLock(minutes) {

  if (
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > 180
  ) {

    throw new Error(
      "Duration must be between 1 and 180 minutes."
    );

  }


  const endTime =
    Date.now() +
    minutes * 60 * 1000;


  /*
   * IMPORTANT:
   * Save the timer BEFORE enabling the redirect.
   * This makes sure blocked.html can immediately
   * read the correct remaining time.
   */

  await chrome.storage.local.set({

    hardLockActive: true,

    hardLockEndTime: endTime

  });


  await enableBlocking();


  await chrome.alarms.clear(
    LOCK_ALARM
  );


  await chrome.alarms.create(
    LOCK_ALARM,
    {
      when: endTime
    }
  );

}


async function stopHardLock() {

  await chrome.alarms.clear(
    LOCK_ALARM
  );


  await disableBlocking();


  await chrome.storage.local.set({

    hardLockActive: false,

    hardLockEndTime: null

  });

}


chrome.runtime.onMessageExternal.addListener(

  (message, sender, sendResponse) => {

    (async () => {

      try {

        if (
          sender.origin !==
          "https://maatram.co.in"
        ) {

          throw new Error(
            "Unauthorized website."
          );

        }


        if (
          message.action ===
          "START_HARD_LOCK"
        ) {

          await startHardLock(
            Number(
              message.durationMinutes
            )
          );


          sendResponse({

            success: true,

            active: true

          });


          return;

        }


        if (
          message.action ===
          "STOP_HARD_LOCK"
        ) {

          await stopHardLock();


          sendResponse({

            success: true,

            active: false

          });


          return;

        }


        if (
          message.action ===
          "GET_STATUS"
        ) {

          const data =
            await chrome.storage.local.get([

              "hardLockActive",

              "hardLockEndTime"

            ]);


          const active =
            Boolean(
              data.hardLockActive
            ) &&

            Number(
              data.hardLockEndTime
            ) > Date.now();


          sendResponse({

            success: true,

            active: active,

            endTime:
              data.hardLockEndTime ||
              null

          });


          return;

        }


        if (message.action === "GET_USAGE") {

          const { usage = {} } = await chrome.storage.local.get("usage");

          sendResponse({ success: true, usage });

          return;

        }

        throw new Error(
          "Unknown message action."
        );


      }

      catch (error) {

        sendResponse({

          success: false,

          error:
            error.message

        });

      }

    })();


    return true;

  }

);


chrome.alarms.onAlarm.addListener(

  async alarm => {

    if (
      alarm.name ===
      LOCK_ALARM
    ) {

      await stopHardLock();

    }

  }

);


async function checkLockState() {

  const data =
    await chrome.storage.local.get([

      "hardLockActive",

      "hardLockEndTime"

    ]);


  if (
    data.hardLockActive &&
    data.hardLockEndTime
  ) {

    if (
      Number(
        data.hardLockEndTime
      ) <= Date.now()
    ) {

      await stopHardLock();

    }

    else {

      const alarm =
        await chrome.alarms.get(
          LOCK_ALARM
        );


      if (!alarm) {

        await chrome.alarms.create(

          LOCK_ALARM,

          {
            when:
              Number(
                data.hardLockEndTime
              )
          }

        );

      }

    }

  }

}


checkLockState();


chrome.runtime.onStartup.addListener(
  checkLockState
);

/*
 * Internal messages from the extension popup.
 * Lets a user start a Hard Lock straight from the
 * toolbar, with no Maatram account needed.
 */

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    (async () => {

      try {

        if (message.action === "START_HARD_LOCK") {

          await startHardLock(
            Number(message.durationMinutes)
          );

          sendResponse({ success: true, active: true });

          return;

        }

        throw new Error("Unknown message action.");

      }

      catch (error) {

        sendResponse({
          success: false,
          error: error.message
        });

      }

    })();

    return true;

  }
);


/*
 * Usage tracking for the Maatram Stats page.
 * Once a minute: if Chrome is focused, the user is not idle and the
 * active tab is one of the protected sites, add 1 minute for that site.
 * Tab URLs are only readable for the protected sites (host permissions),
 * so no other browsing is ever seen. Data stays in chrome.storage.local
 * and is only handed to maatram.co.in when the Stats page asks.
 */

const USAGE_ALARM = "maatram-usage-tick";
const KEEP_DAYS = 35;

function dayKey(date = new Date()) {
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}

function siteOf(url) {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_DOMAINS.find(d => host === d || host.endsWith("." + d)) || null;
  } catch (_) {
    return null;
  }
}

async function tickUsage() {
  if (await chrome.idle.queryState(60) !== "active") return;

  const win = await chrome.windows.getLastFocused().catch(() => null);
  if (!win || !win.focused) return;

  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  const site = tab && tab.url && siteOf(tab.url);
  if (!site) return;

  const { usage = {} } = await chrome.storage.local.get("usage");
  const day = dayKey();
  usage[day] = usage[day] || {};
  usage[day][site] = (usage[day][site] || 0) + 1;

  const cutoff = dayKey(new Date(Date.now() - KEEP_DAYS * 864e5));
  for (const k of Object.keys(usage)) if (k < cutoff) delete usage[k];

  await chrome.storage.local.set({ usage });
}

chrome.alarms.get(USAGE_ALARM).then(a => a || chrome.alarms.create(USAGE_ALARM, { periodInMinutes: 1 }));

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === USAGE_ALARM) tickUsage().catch(console.error);
});
