=== Mini Preview ===
Contributors: garethhadfield
Donate link: https://opdiv.com/donate
Tags: editor, preview, responsive, desktop, mobile, tablet
Requires at least: 4.7
Tested up to: 6.0
Stable tag: 1.3.2
Requires PHP: 5.2.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Author: Gareth Hadfield
Author URI: https://opdiv.com/

Displays a mini preview when a page or post is being edited.

== Description ==

This WordPress plugin displays a mini preview window on the edit post or edit page screen.

Mini Preview sits in the Page or Post tab when you are editing a page or post in WordPress.

Buttons above the preview window provide for Refresh, various display sizes, and preview in new tab.

The preview window is a fully-functional, interactive mini browser showing exactly what the page will look like, except in miniature.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/plugin-name` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress

== Frequently Asked Questions ==

= Can I move the Mini Preview window? =

Yes, the Mini Preview is draggable. You can drag it to change its place within the meta boxes.

= How do I change the preview window size (resolution)? =

The second button on the toolbar is the "Next Resolution" button. Clicking this button cycles through the resolutions. 
Alternatively, click the down arrow and the resolution menu will display. Click the resolution you wish to use.

== Screenshots ==

1. Mini Preview in the WordPress Page menu while editing a page.

== Changelog ==

= 1.3.2 =
* Compatibility with WordPress 6

= 1.3.1 =
* Fix issue where shortcut keys were not working
* Updated help text for shortcut keys

= 1.3 =
* Fix issue where admin bar was showing in previews
* Added settings screen with help text and setting for hiding admin bar
* Added shortcut keys to activate mini preview and bring it into view
* Work around a bug in Safari where the preview window could be blank

= 1.2 =
* The mini preview window and [Preview in New Tab] now display the latest autosave draft
* Clicking [Refresh] or [Preview in New Tab] now triggers an autosave and displays the result once autosave is complete 
* Holding CMD (mac) or CTRL (windows) while clicking [Preview in New Tab] skips the autosave and opens the tab immediately
* Holding SHIFT+CMD (Mac) while clicking [Preview in New Tab] opens the new tab immediately and in the foreground
* Holding CMD (mac) or CTRL (windows) while clicking [Refresh] skips the autosave and refreshes the mini preview window immediately
* Prevent preview from displaying on non-block editor screens (no longer supported)
* Fix issue where mini preview was blank in some cases
* Fix issue where mini preview was not sized correctly in some cases
* Fix issue with resolution menu not visible on iOS in Safari
* Fix issue in Edge browser on Windows 10 where preview window would cause the meta box area to expand

= 1.1.1 =
* Fix issue where menu button icons do not show up
* Fix issue where preview window is not visible

= 1.1 =
* Tested up to WordPress version 5.7
* Modify resolution buttons - buttons are now in a sub menu
* Add "preview in new tab" button
* Adjust icon positions on menu

= 1.0 =
* Initial Release