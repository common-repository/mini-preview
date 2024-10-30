/*
Mini Preview

Author: Gareth Hadfield
Author URI: https://opdiv.com/mini-preview

License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

/*
global document jQuery setTimeout wp
*/

var miniPreview = new function(){
	const $ = jQuery;
	
	const REFRESH_DELAY = 4000;
	const MIN_DELAY_BETWEEN_REFRESH = 3000;

	var DEFAULT_HIDE_ADMIN_BAR = true;

	var refreshTimeout;
	var lastRefresh = Date.now();

	var pluginDirUrl = '/wp-content/plugins/mini-preview/';
	
	var previewUrl = '';
	
	function addQueryString(aUrl, aQueryString){
		var result = aUrl;
		if(aUrl.search(/\?/) === -1){
			result += "?";
		}
		else{
			result += "&";
		}
		result += aQueryString;
		return(result);
	}
	
	function getAutosaves(){
		var aData = wp.data.select('core');
		
		const aPostType = wp.data.select('core/editor').getCurrentPostType();
		
		var aAutosave = aData.getAutosave(aPostType, miniPreview.postID, miniPreview.userID);
		
		if(aAutosave === undefined){
			// there are no autosaves so use the post url
			previewUrl = miniPreview.postUrl;
		}
		else{
			previewUrl = aAutosave.preview_link;
		}
	}
	
	function getUrl(hideAdminBar){

		if(hideAdminBar === undefined){
			hideAdminBar = DEFAULT_HIDE_ADMIN_BAR;
		}

		var aUrl = previewUrl;

		if(hideAdminBar){
			aUrl = addQueryString(aUrl, 'admin_bar=false');
		}
		
		return(aUrl);
	}
	
	function getIframe(){
		return(document.getElementById('mini_preview_iframe'));
	}
	
	function lastRefreshLongAgo(){
		var timeDiff = (Date.now() - lastRefresh);
		return(timeDiff > MIN_DELAY_BETWEEN_REFRESH);
	}

	function schedulePreviewRefresh(){
		if(lastRefreshLongAgo()){
			clearTimeout(refreshTimeout);
			refreshTimeout = setTimeout(refreshPreview, REFRESH_DELAY);
		}
	}

	function schedulePreviewResize(){
		miniPreview.adjustSize();
		setTimeout(miniPreview.adjustSize, 100);
		setTimeout(miniPreview.adjustSize, 1000);
		setTimeout(miniPreview.adjustSize, 2000);
		setTimeout(miniPreview.adjustSize, 5000);
	}
	
	var triggerOpenNewTab = false;
	
	function autosave(){
		var aResult = wp.data.dispatch('core/editor').autosave();
		return(aResult);
	}
	
	function previewInNewTab(skipAutosave = false){
		if(skipAutosave){
			prepareOpenPreviewWindow(getUrl());
		}
		else{
			triggerOpenNewTab = true;
			prepareOpenPreviewWindow();
			autosave();
		}
	}
		
	this.previewInNewTabClick = function(e){
		previewInNewTab(e.metaKey || e.ctrlKey);
	};

	function scrollOutOfBounds(){
		var aFrame = jQuery("#mini_preview_iframe");
		return((aFrame[0].contentWindow.scrollY < 0) || 
			((aFrame[0].contentWindow.scrollY + 1) > (aFrame[0].contentWindow.document.documentElement.getBoundingClientRect().height - aFrame.height())));
	}

	function fixSafariBug(){
		if(isSafari()){
			$(window).focus(function(){
				if(scrollOutOfBounds()){
					jQuery("#mini_preview_iframe")[0].contentWindow.scroll(0, 0);
				}

				setTimeout(function(){
					// Work around a Safari bug that causes the iframe to be blank
					$('#mini_preview_iframe')[0].contentWindow.scrollBy(0, 1);
					setTimeout(function(){
						$('#mini_preview_iframe')[0].contentWindow.scrollBy(0, -1);
					}, 100);
				}, 100);
			});
		}
	}
	
	this.init = function(aUrl, aPluginDirUrl, aPostID, aUserID, aHideAdminBar = true){

		DEFAULT_HIDE_ADMIN_BAR = aHideAdminBar;

		initRenderWidthHeight();
		
		if(aUrl !== undefined){
			aUrl = decodeURIComponent(aUrl);
			miniPreview.postUrl = aUrl;
			previewUrl = aUrl;
		}
		
		if(aPluginDirUrl !== undefined){
			aPluginDirUrl = decodeURIComponent(aPluginDirUrl);
			pluginDirUrl = aPluginDirUrl;
		}
		
		if(aPostID !== undefined){
			miniPreview.postID = aPostID;
		}
		
		if(aUserID !== undefined){
			miniPreview.userID = aUserID;
		}

		fixSafariBug();
		
		$(document).ready(function(){
			setTimeout(function(){
				refreshPreview();
				
				watchPreview();
			}, 200);
		});
	};
	
	function setHTML(aHTML){
		$(document).ready(function(){
			let doc = getIframe().contentWindow.document;
			doc.open();
			doc.write(aHTML);
			doc.close();
		});
	}
	
	function refreshHTML(){
		if(miniPreview.html !== undefined){
			setHTML(miniPreview.html);
		}
	}
	
	function watchPreview(){

		var observer = new MutationObserver(function(mutations){
			if(!metaBoxesHidden()){
				if(miniPreview.html !== undefined){
					refreshHTML();
				}
				else{
					initPreview();
					setTimeout(function(){
						refreshPreview();
					}, 0);
				}
			}
		});
		
		var aMetaboxes = document.getElementById('metaboxes');
		if(aMetaboxes !== null){
			observer.observe(aMetaboxes, {childList: true});
		}
		
		$(window).resize(function(){
			schedulePreviewResize();
		});
		
		$('#mini-preview-meta-box > .postbox-header').click(function(){
			schedulePreviewResize();
		});
		
		$('body').on('DOMNodeInserted', '#postbox-container-2', function(e){
			if (e.target.id === 'mini-preview-meta-box'){
				refreshHTML();
			}
		});
		
	}
	
	function previewLoadingHeadHTML(){
		return(
			'<title>Loading...</title>' +
			'<link rel="stylesheet" href="' + pluginDirUrl + 'mini_preview_style.css" type="text/css" media="all">'
			);
	}
	
	function setPreviewLoadingHTML(aWindow){
		var aDoc;
		if(aWindow.contentDocument !== undefined){
			aDoc = aWindow.contentDocument;
		}
		else{
			aDoc = aWindow.document;
		}
		
		aDoc.title = 'Loading...';
		
		aDoc.head.innerHTML = previewLoadingHeadHTML();
		
		aDoc.body.style.backgroundColor = '#23282d';
		aDoc.body.style.position = 'initial';
		aDoc.body.style.margin = '0px';
		aDoc.body.innerHTML = '<div class="loader"></div>';
	}
	
	function initPreview(){
		setPreviewLoadingHTML(getIframe());
	}
	
	function metaBoxesHidden(){
		return((getIframe() === null) || ((document.getElementById('metaboxes') !== null) && document.getElementById('metaboxes').contains(getIframe())));
	}
	
	function doRefresh(skipAutosave = false){
		if(skipAutosave){
			refreshPreview();
		}
		else{
			autosave();
		}
	}
	
	this.refreshButtonClick = function(e){
		doRefresh(e.metaKey || e.ctrlKey);
	};

	function refreshPreview(){
		if(metaBoxesHidden()){ // don't refresh if hidden
			schedulePreviewRefresh();
		}
		else{
			initPreview();

			// we can not just set the src of the iframe since wordpress will think that the
			// iframe is its own preview window and so clicking the wordpress preview button
			// will not work. So instead we load the html via ajax.
			
			//getIframe().src = previewUrl;
			
			$.ajax({
				url: getUrl(),
				type: 'get',
				success: function(result){
					miniPreview.html = result;
					refreshHTML();
					schedulePreviewResize();
				}
			});
			
			schedulePreviewResize();
		}

		lastRefresh = Date.now();
	}
	
	const DEFAULT_WIDTH = 414;
	const DEFAULT_HEIGHT = 896;
	
	var renderWidth = DEFAULT_WIDTH;
	var renderHeight = DEFAULT_HEIGHT;
	
	function setResolutionButton(){
		// update res button to show image for current res
		var currentButton = getCurrentButton();
		$('#mini-preview-next-resolution-button')[0].className = currentButton.className;
				
		$('.mini-preview-meta-buttons .button').removeClass('mini-preview-selected');
		$(currentButton).addClass('mini-preview-selected');
	}
	
	function getResMenu(){
		return($('#miniPreviewScreenMenu'));
	}
	
	function resMenuVisible(){
		return(getResMenu().css('display') !== 'none');
	}
	
	function resMenuBlur(e){
		if(resMenuVisible()){
			var resDiv = getResMenu()[0];
			if((e.target !== $('.mini-preview-resolution-button')[0]) && (e.target !== resDiv) && (!resDiv.contains(e.target))){
				hideResMenu();
			}
		}
	}
	
	function isIOS(){
		var n = navigator;
		var aResult = (/iPad|iPhone|iPod/.test(n.platform)) ||
			(n.maxTouchPoints && (n.maxTouchPoints > 2) && /MacIntel/.test(n.platform));
		return(aResult);
	}
	
	// initialise menu removal
	$(document).mousedown(resMenuBlur);
	
	function showResMenu(){
		let resMenu = getResMenu();
		if(isIOS()){
			resMenu.css('position', 'relative');
		}
		resMenu.css('display', 'block');
		$('#mini-preview-meta-box>.inside').css('min-height', resMenu.height() + resMenu[0].offsetTop + 'px');
	}
	
	function hideResMenu(){
		getResMenu().css('display', 'none');
		$('#mini-preview-meta-box>.inside').css('min-height', 'unset');
	}
	
	function initRenderWidthHeight(){
		var aWidth = localStorage.miniPreviewWidth;
		var aHeight = localStorage.miniPreviewHeight;
		
		if((aWidth === null) || (aWidth === undefined) || isNaN(aWidth)){
			aWidth = DEFAULT_WIDTH;
		}
		
		if((aHeight === null) || (aHeight === undefined) || isNaN(aHeight)){
			aHeight = DEFAULT_HEIGHT;
		}
		
		renderWidth = aWidth;
		renderHeight = aHeight;
		
		setResolutionButton();
	}
	
	function saveRenderWidthHeight(){
		localStorage.miniPreviewWidth = renderWidth;
		localStorage.miniPreviewHeight = renderHeight;
	}
	
	function heightRatio(){
		return(renderHeight / renderWidth);
	}
	
	this.adjustSize = function(aRenderWidth, aRenderHeight){
		var shouldHide = ((aRenderWidth !== undefined) && (aRenderHeight !== undefined));
		
		if(aRenderWidth !== undefined){
			renderWidth = aRenderWidth;
		}
		
		if(aRenderHeight !== undefined){
			renderHeight = aRenderHeight;
		}
				
		saveRenderWidthHeight();
		
		var aPreviewDiv = $('.mini-preview-meta-preview-div')[0];
		$(aPreviewDiv).css('width', '100%');
		var aWidth = $(aPreviewDiv).width();
		var aHeight = parseInt(heightRatio() * aWidth, 10);
		
		if((aWidth !== 0) && (aHeight !== 0)){
			$(aPreviewDiv).css('height', aHeight + 'px');
			
			var aIframe = getIframe();
			
			$(aIframe).css('width', renderWidth + 'px');
			$(aIframe).css('height', renderHeight + 'px');
			
			var aScale = aWidth / renderWidth;
			
			$(aIframe).css('transform-origin', 'top left');
			$(aIframe).css('transform', 'scale(' + aScale + ')');
			
			setResolutionButton();
		}
		
		if(shouldHide){
			hideResMenu();
		}
	};
	
	function getCurrentButton(){
		return($('.button[data-width="' + renderWidth + '"][data-height="' + renderHeight + '"]')[0]);
	}
	
	// cycles through resolutions
	this.nextResolutionButtonClick = function(){
		var currentButton = getCurrentButton();
		var newResButton;
		if(currentButton.nextSibling === null){
			// go to first
			newResButton = currentButton.parentNode.firstChild;
		}
		else{
			// go to next
			newResButton = currentButton.nextSibling;
		}
		miniPreview.adjustSize(newResButton.dataset.width, newResButton.dataset.height);
	};
	
	this.resolutionButtonClick = function(){
		if(resMenuVisible()){
			hideResMenu();
		}
		else{
			showResMenu();
		}
	};
	
	var PREVIEW_WINDOW_NAME = 'mini_preview_window';
	var aPreviewInNewTabWindow;

	var aPostSaveHasBegun = false;
	
	function focusPreview(){
		// works in Firefox but does not work in Safari or Chrome (use cmd+shift instead)
		setTimeout(function(){
			aPreviewInNewTabWindow.focus();
		}, 0);
	}
	
	function checkPreviewWindowName(){
		if(aPreviewInNewTabWindow.name !== PREVIEW_WINDOW_NAME){
			aPreviewInNewTabWindow.name = PREVIEW_WINDOW_NAME;
		}
		else{
			watchPreviewWindowName();
		}
	}
	
	function watchPreviewWindowName(){
		setTimeout(checkPreviewWindowName, 1000);
	}
	
	function onSaveComplete(){
		getAutosaves();
		
		if(triggerOpenNewTab){
			triggerOpenNewTab = false;
			if((aPreviewInNewTabWindow !== undefined) && (!aPreviewInNewTabWindow.closed)){
				aPreviewInNewTabWindow.location.href = getUrl();
				
				watchPreviewWindowName();

				focusPreview();
			}
		}
		refreshPreview();
	}
	
	function prepareOpenPreviewWindow(aUrl = ''){
		var isNewWindow = ((aPreviewInNewTabWindow === undefined) || aPreviewInNewTabWindow.closed);
		if(isNewWindow){
			aPreviewInNewTabWindow = window.open(aUrl, PREVIEW_WINDOW_NAME);
		}
		
		if(aUrl === ''){
			setPreviewLoadingHTML(aPreviewInNewTabWindow);
		}
		else{
			if(!isNewWindow){
				aPreviewInNewTabWindow.location.href = aUrl;
			}
			watchPreviewWindowName();
			focusPreview();
		}
	}

	function isFirefox(){
		return(navigator.userAgent.indexOf('Firefox') !== -1);
	}

	function isSafari(){
		return(
			(navigator.appVersion.indexOf('Safari/') !== -1) &&
			(navigator.appVersion.indexOf('Chrome/') === -1) &&
			(navigator.appVersion.indexOf('Edg/') === -1)
		);
	}

	function isFirefoxPreviewKey(e){
		return((e.code === 'KeyP') && (e.keyCode === 8719) && e.shiftKey && isFirefox());
	}

	function isPeviewKey(e){
		var aResult = isFirefoxPreviewKey(e);
		if(aResult){
			e.preventDefault();
		}
		else{
			aResult = ((e.code === 'KeyP') && e.altKey && (e.ctrlKey || e.metaKey));
		}
		return(aResult);
	}

	var SIDEBAR_BUTTON_CLASS = "div.interface-pinned-items > button.components-button:first-child";
	var SIDEBAR_BUTTON_OPEN_CLASS = "div.interface-pinned-items > button.components-button.is-pressed.has-icon";

	function sidebarIsOpen(){
		var aSideBarButton = $(SIDEBAR_BUTTON_OPEN_CLASS);
		return(aSideBarButton.length !== 0);
	}

	function closeSidebar(){
		var aSideBarButton = $(SIDEBAR_BUTTON_OPEN_CLASS);
		if(aSideBarButton.length === 1) {
			aSideBarButton.trigger('click');
		}
	}

	function openSidebar(){
		var aSideBarButton = $(SIDEBAR_BUTTON_CLASS);
		if(aSideBarButton.length === 1) {
			aSideBarButton.trigger('click');
		}
	}

	var PAGE_PANEL_CLASS = 'button.edit-post-sidebar__panel-tab';

	function clickPageTab(){
		var aPageTab = $(PAGE_PANEL_CLASS + "[aria-label='Page']");
		if(aPageTab.length === 1){
			aPageTab.trigger('click');
		}
	}

	function clickPostTab(){
		var aPostTab = $(PAGE_PANEL_CLASS + "[aria-label='Post']");
		if(aPostTab.length === 1){
			aPostTab.trigger('click');
		}
	}

	function pageTabIsActive(){
		var aPageTab = $(PAGE_PANEL_CLASS + "[aria-label='Page (selected)']");
		return(aPageTab.length === 1);
	}

	function postTabIsActive(){
		var aPostTab = $(PAGE_PANEL_CLASS + "[aria-label='Post (selected)']");
		return(aPostTab.length === 1);
	}

	function postOrPageTabIsActive(){
		return(postTabIsActive() || pageTabIsActive());
	}

	function previewMetaboxIsOpen(){
		var aMiniPreview = $("#mini-preview-meta-box.closed");
		return(aMiniPreview.length === 0);
	}

	function openPreviewMetabox() {
		var aMiniPreview = $("#mini-preview-meta-box.closed");
		if (aMiniPreview.length === 1) {
			aMiniPreview.removeClass('closed');
		}
	}

	function scrollMiniPreviewIntoView(){
		var aMiniPreview = $("#mini-preview-meta-box");
		if(aMiniPreview.length === 1){
			aMiniPreview[0].scrollIntoView();
		}
	}

	function isOnScreen(aElement){
		var aResult = false;
		if((aElement !== undefined) && (aElement !== null)){
			var aRect = aElement.getBoundingClientRect();
			if((aRect !== null) && (aRect !== undefined)){
				// This is deliberately only checking the top and left and not checking if the
				// bottom and right are on screen since the screen may be too narrow or too short
				// causing it to always return false
				aResult = (aRect.top >= 0) && (aRect.left >= 0) && 
					(aRect.top < window.innerHeight) && (aRect.left < window.innerWidth);
			}
		}
		return(aResult);
	}

	function previewMetaboxIsOnScreen(){
		return(isOnScreen(document.getElementById("mini-preview-meta-box")));
	}

	function showMiniPreview(){
		if (sidebarIsOpen() && postOrPageTabIsActive() && previewMetaboxIsOpen() && previewMetaboxIsOnScreen()){
			closeSidebar();
		}
		else{
			openSidebar();
			clickPageTab();
			clickPostTab();
			openPreviewMetabox();
			scrollMiniPreviewIntoView();
		}
	}

	function listenForPreviewKey(){
		$(document).keypress(function(e){
			if(isPeviewKey(e.originalEvent)){
				showMiniPreview();
			}
		});
	}

	function listenForEditorSaves(){
		wp.data.subscribe(function () {
			var coreEditor = wp.data.select('core/editor');

			if (coreEditor !== null) {
				var isSavingPost = coreEditor.isSavingPost();
				var didPostSaveRequestSucceed = coreEditor.didPostSaveRequestSucceed();
				var didPostSaveRequestFail = coreEditor.didPostSaveRequestFail();

				if (isSavingPost) {
					aPostSaveHasBegun = true;
				}
				else if (aPostSaveHasBegun) {
					aPostSaveHasBegun = false;
					onSaveComplete();
				}
			}
		});
	}
	
	$(document).ready(function(){
		listenForPreviewKey();
		listenForEditorSaves();
	});

};