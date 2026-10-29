# Privacy

QRify does not collect, transmit or sell any data.

<br/>

## What is stored

- your recent codes: the text of each, its colors and size, and when you made it, so you can open it again from the **Recent** list
- your theme setting: light or dark

Nothing else is stored. Text you type but never turn into a code is not kept.

<br/>

## Where it is stored

In `chrome.storage.local`, in your Chrome profile on that one browser. It is not synced, and QRify has no server and makes no network requests: every code is drawn in the popup.

**Share** hands the image to your operating system's share sheet only when you click it, and only to the app you pick there.

<br/>

## Permissions

| Permission | Used for |
|---|---|
| `activeTab` | **Current page URL** reads the address of the tab you are on, only when you click the button after opening QRify |
| `contextMenus` | The right-click entries for selected text, links and images |
| `storage` | The recent list and the theme, as above |

QRify cannot read the content of your pages, your cookies or your browsing history.

<br/>

## Removing your data

Removing the extension deletes everything it stored. To keep the extension but clear the list and the theme, open the popup's DevTools (right-click the popup, **Inspect**) and run `chrome.storage.local.clear()`.
