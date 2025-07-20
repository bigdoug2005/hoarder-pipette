# Kagi Hoarder Search Extension

A simple Chrome extension that displays your Hoarder bookmarks directly in Kagi search results.

## Features

- **Seamless Integration**: Shows relevant bookmarks from your Hoarder instance alongside Kagi search results
- **Easy Configuration**: Simple popup interface to set up your Hoarder URL and API key
- **Fast Search**: Queries your bookmarks in real-time as you search
- **Clean UI**: Minimal, non-intrusive design that fits naturally with Kagi's interface

## Installation

### 1. Download Extension Files
Clone or download this extension to a local folder:
```
simple-kagi-hoarder/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── content.css
└── README.md
```

### 2. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `simple-kagi-hoarder` folder
5. The extension should now appear in your extensions list

### 3. Configure Hoarder Connection
1. Click the extension icon in Chrome's toolbar
2. Enter your Hoarder instance URL (e.g., `https://your-hoarder.com`)
3. Enter your Hoarder API key
4. Click "Test Connection" to verify settings
5. Click "Save Settings"

## Getting Your Hoarder API Key

1. Log into your Hoarder instance
2. Go to Settings → API Keys
3. Create a new API key
4. Copy the key and paste it into the extension settings

## Usage

1. Go to [Kagi.com](https://kagi.com) and perform a search
2. The extension will automatically search your Hoarder bookmarks
3. Relevant bookmarks will appear in a dedicated section in the search results
4. Click on any bookmark to open the original URL

## Features in Detail

### Search Integration
- Extracts search terms from Kagi URLs (format: `https://kagi.com/search?q=Term1+Term2`)
- Searches your Hoarder bookmarks using the same query
- Displays up to 5 most relevant results

### Bookmark Display
- Shows bookmark title, URL, and description
- Displays associated tags
- Direct links to original bookmarked content
- Clean, card-based layout

### Error Handling
- Configuration prompts if Hoarder isn't set up
- Clear error messages for API failures
- Graceful fallback when no bookmarks match

## Troubleshooting

### "Hoarder not configured" Error
- Make sure you've entered both URL and API key in the extension popup
- Test the connection to verify credentials

### "API Error: 401" 
- Your API key may be invalid or expired
- Generate a new API key in Hoarder settings

### "API Error: 403"
- Your API key doesn't have sufficient permissions
- Ensure the key has read access to bookmarks

### No Results Appearing
- Check that your Hoarder instance is accessible from your browser
- Verify the URL format includes the protocol (https://)
- Ensure your search terms match content in your bookmarks

### Extension Not Loading
- Verify all files are in the correct folder structure
- Check the Chrome extensions page for any error messages
- Try disabling and re-enabling the extension

## Privacy & Security

- All communication is directly between your browser and your Hoarder instance
- No data is sent to third parties
- API keys are stored locally in Chrome's secure storage
- Extension only activates on Kagi search pages

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: Limited to storage and Kagi.com access
- **API Integration**: Uses Hoarder's `/api/v1/bookmarks/search` endpoint
- **Authentication**: Bearer token authentication

## Customization

You can modify the extension by editing:
- `content.css`: Change the visual appearance
- `content.js`: Adjust search behavior or result formatting
- `manifest.json`: Add support for other search engines

## Support

This extension is based on the architecture patterns from the [hoarder-pipette](https://github.com/DanSnow/hoarder-pipette) project but simplified for easier setup and maintenance.

For Hoarder-related issues, visit the [Hoarder documentation](https://docs.hoarder.app/).