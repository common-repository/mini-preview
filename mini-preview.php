<?php
/**
 * Plugin Name: Mini Preview
 * Plugin URI: https://opdiv.com/mini-preview
 * Description: Displays a mini preview when a page or post is being edited.
 * Author: Gareth Hadfield
 * Author URI: https://opdiv.com/
 * Version: 1.3.2
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

class MiniPreview{

	public const SETTINGS = 'mini_preview';
	public const SETTINGS_PREFIX = 'mini_preview_';
	public const SETTINGS_PAGE_NAME = 'mini_preview_settings';

	public static function settingsGeneralSectionUI(){
		$help = '<div class="mini-preview-help">';
		$help .= '<div><h3>' . __('Tips', 'mini-preview') . '</h3></div>';
		$help .= '<div><ul>';
		$help .= '<li>' . __('The Mini Preview window is visible in the <b>Page or Post tab</b> when you are editing a page or post.', 'mini-preview') . '</li>';
		$help .= '<li>' . __('For a <b>new page or post</b>, the Mini Preview will only become available after the first save or autosave.', 'mini-preview') . '</li>';
		$help .= '<li>' . __('For quick access to the Mini Preview window, use <b>CTRL+OPT+P</b> or <b>CTRL+ALT+P</b> or <b>OPT+CMD+P</b> or <b>ALT+WIN+P</b> (ALT+SHIFT+P or OPT+SHIFT+P for Firefox).', 'mini-preview') . '</li>';
		$help .= '<li>' . __('For more information visit the <a target="_blank" href="https://wordpress.org/plugins/mini-preview/">WordPress forum</a> or <a target="_blank" href="https://opdiv.com/mini-preview/">Mini Preview on opdiv.com</a>.', 'mini-preview') . '</li>';
		$help .= '</ul></div>';
		$help .= '</div>';
		echo $help;
	}

	public static function getSettingsFields(){
		ob_start();
		settings_fields(static::SETTINGS); 
		do_settings_sections(static::SETTINGS_PAGE_NAME);
		submit_button(); 
		return(ob_get_clean());
	}

	public static function settingsPageUI(){
		$html = '';
		$html .= '<div class="wrap">';
		$html .= '<?php screen_icon(); ?>';
		$html .= '<h2>Mini Preview Settings</h2>';
		$html .= '<form method="post" action="options.php">';
		$html .= static::getSettingsFields();
		$html .= '</form>';
		$html .= '</div>';

		echo $html;
	}

	public static function initSettingsPage(){
		add_options_page(
			__('Mini Preview Options', 'mini-preview'),
			__('Mini Preview', 'mini-preview'),
			'manage_options',
			static::SETTINGS_PAGE_NAME,
			array('MiniPreview', 'settingsPageUI'));
	}

	public static function booleanField($args){
		echo '<input type="hidden" id="' . $args['name'] . '" name="' . $args['name'] . '" value="' . $args['value'] . '">';
		echo '<input type="checkbox" onchange="jQuery(\'#'.$args['name'].'\').val(this.checked);"';
		if($args['value'] === 'true'){
			echo ' checked';
		}
		echo '>';
	}

	public static function textField($args){
		echo 'textField';
		echo '<input type="text" id="' . $args['name'] . '" name="' . $args['name'] . '" value="' . $args['value'] . '">';
		echo json_encode($args);
	}

	public static function settingsFieldUI($args){
		if($args['type'] === 'boolean'){
			static::booleanField($args);
		}
		else{
			static::textField($args);
		}
	}

	public static $sanitizeCount = 0;

	public static function sanitizeHideAdminBarSettings($data){
		static::$sanitizeCount++;
		if(static::$sanitizeCount === 1){
			add_settings_error(static::SETTINGS_PREFIX . 'hide_admin_bar_in_preview', 'test code', 
			'Settings saved. Any open edit pages will need to be refreshed to use the new settings.', 'success');
		}
		return($data);
	}

	public static function initSettingsUI(){
		$section = static::SETTINGS_PREFIX . 'section_general';

		add_settings_section(
			$section,
			'General',
			array('MiniPreview', 'settingsGeneralSectionUI'),
			static::SETTINGS_PAGE_NAME
		);

		$fieldName = static::SETTINGS_PREFIX . 'hide_admin_bar_in_preview';
		$fieldValue = get_option($fieldName, 'true');

		register_setting(
			static::SETTINGS,
			$fieldName,
			array(
				'type' => 'string',
				'description' => 'Whether the admin bar is visible in previews',
				'default' => 'true',
				'sanitize_callback' => array('MiniPreview', 'sanitizeHideAdminBarSettings'),
			));
		
		add_settings_field(
			static::SETTINGS_PREFIX . 'hide_admin_bar_in_preview',
			'Hide WordPress admin bar in previews',
			array('MiniPreview', 'settingsFieldUI'),
			static::SETTINGS_PAGE_NAME,
			$section,
			array(
				'section' => $section,
				'name' => $fieldName,
				'value' => $fieldValue,
				'type' => 'boolean',
				)
		);			
	}

	public static function pluginPageSettingsLink($links){
    	$links[] = '<a href="options-general.php?page=' . static::SETTINGS_PAGE_NAME . '">' . esc_html('Settings', 'mini-preview') . '</a>';
		return($links);
	}	
	
	public static function initSettings(){
		add_action('admin_menu', array('MiniPreview', 'initSettingsPage'));
		add_filter('plugin_action_links_' . plugin_basename(__FILE__), array('MiniPreview', 'pluginPageSettingsLink'));

		add_action('admin_init', array('MiniPreview', 'initSettingsUI'));
	}

	private static function editingScreen(){
		if(function_exists('get_current_screen')){
			$current_screen = get_current_screen();
			$result = (
				($current_screen->base === 'post') && (($current_screen->post_type === 'post') || ($current_screen->post_type === 'page')) &&
				(method_exists($current_screen, 'is_block_editor') && $current_screen->is_block_editor())
				);
		}
		else{
			$result = false;
		}
		return($result);
	}
	
	private static function settingsScreen(){
		if(function_exists('get_current_screen')){
			$current_screen = get_current_screen();
			$result = ($current_screen->base === 'settings_page_' . static::SETTINGS_PAGE_NAME);
		}
		else{
			$result = false;
		}
		return($result);
	}
	
	public static function removeAdminBar(){
		if(isset($_GET['admin_bar']) && ($_GET['admin_bar'] === 'false')){
			add_filter('show_admin_bar', '__return_false');
		}
	}
	
	private static function buttonHTML($class, $onclick, $title = '', $extra = '', $content = ''){
		return('<i class="' . esc_attr($class) . '" aria-hidden="true" onclick="' . $onclick . '" title="' . esc_attr($title) . '" ' . $extra . '>' . $content . '</i>');
	}

	private static function screenButtonHTML($class, $width, $height){
		$extra = 'data-width="' . esc_attr($width) . '" data-height="' . esc_attr($height) . '"';
		$content = '<span class="mini-preview-res-text">&nbsp;&nbsp;(' . esc_attr($width) . 'x' . esc_attr($height) . ')</span>';
		return(static::buttonHTML($class . ' mini-preview-screen-button', 
			'miniPreview.adjustSize(' . esc_attr($width) . ', ' . esc_attr($height) . ');', 
			esc_attr($width) . ' x ' . esc_attr($height), 
			$extra,
			$content));
	}
	
	private static function screenMenuHTML(){
		define("DESK1", "fa fa-desktop button mini-preview-desktop1-button");
		define("DESK2", "fa fa-desktop button mini-preview-desktop2-button");
		define("DESK3", "fa fa-desktop button mini-preview-desktop3-button");
		
		define("TABLET1", "fa fa-tablet button mini-preview-tablet1-button");

		define("MOBILE1", "fa fa-mobile button mini-preview-mobile1-button");
		define("MOBILE2", "fa fa-mobile button mini-preview-mobile2-button");
		
		$result =
			'<div id="miniPreviewScreenMenu">' .
			
			static::screenButtonHTML(DESK1, 800, 600) .
			static::screenButtonHTML(DESK1, 1024, 768) .
			static::screenButtonHTML(DESK1, 1280, 720) .

			static::screenButtonHTML(DESK2, 1366, 768) .
			static::screenButtonHTML(DESK2, 1440, 900) .
			static::screenButtonHTML(DESK2, 1600, 900) .
			
			static::screenButtonHTML(DESK3, 1536, 864) .
			static::screenButtonHTML(DESK3, 1920, 1080) .
			
			static::screenButtonHTML(TABLET1, 768, 1024) .
			static::screenButtonHTML(TABLET1, 834, 1112) .
			static::screenButtonHTML(TABLET1, 800, 1280) .
			static::screenButtonHTML(TABLET1, 1280, 800) .
		
			static::screenButtonHTML(MOBILE1, 360, 640) .
			static::screenButtonHTML(MOBILE1, 375, 667) .
			static::screenButtonHTML(MOBILE2, 414, 736) .
			static::screenButtonHTML(MOBILE2, 414, 896) .
			
			'</div>';
			
		return($result);
	}
	
	private static function previewHTML(){
		global $post;

		$result = '';

		$url = get_preview_post_link($post->ID);

		$result =
			'<div class="mini-preview-meta-preview-container">' .

			'<div class="mini-preview-meta-buttons">' .

			static::buttonHTML('fa fa-refresh button mini-preview-refresh-button', 'miniPreview.refreshButtonClick(event);', "Refresh \n(cmd or ctrl to skip autosave)") .
			
			static::buttonHTML('fa fa-desktop button mini-preview-desktop1-button', 'miniPreview.nextResolutionButtonClick();', 'Next Resolution', 'id="mini-preview-next-resolution-button"') .
			static::buttonHTML('fa fa-chevron-down button mini-preview-resolution-button', 'miniPreview.resolutionButtonClick();', 'Choose Resolution') .

			static::buttonHTML('fa fa-external-link button mini-preview-external-button', 'miniPreview.previewInNewTabClick(event);', "Preview in New Tab \n(cmd or ctrl to skip autosave)") .

			static::screenMenuHTML() .

			'</div>' .

			'<div class="mini-preview-meta-preview-div">' .
			'<iframe class="mini-preview-iframe" id="mini_preview_iframe" src=""></iframe>' .
			'</div>' .


			'</div>' .
			'<div style="clear:both;"></div>' .

			'<script>' . PHP_EOL .
			
			'miniPreview.init("' . 
				rawUrlEncode(esc_url_raw($url)) . '", "' . 
				rawUrlEncode(esc_url_raw(plugin_dir_url(__FILE__))) . '", ' . 
				$post->ID . ', ' . 
				get_current_user_id() . ', ' . 
				get_option(static::SETTINGS_PREFIX . 'hide_admin_bar_in_preview') . ');' . PHP_EOL .

			'</script>';

		return($result);
	}
	
	public static function metaBoxHTML(){
		echo MiniPreview::previewHTML();
	}

	public static function addMetaBox(){
		if(static::editingScreen()){
			add_meta_box('mini-preview-meta-box', 'Preview', array('MiniPreview', 'metaBoxHTML'), array('page', 'post'), 'side', 'high', null);
		}
	}

	public static function init(){
		if(static::editingScreen() || static::settingsScreen()){
			add_action('admin_enqueue_scripts', array('MiniPreview', 'loadStyles'));
		}

		if(static::editingScreen()){
			add_action('admin_enqueue_scripts', array('MiniPreview', 'loadScripts'));
			add_action('admin_enqueue_scripts', array('MiniPreview', 'loadStyles'));
		}
	}
	
	public static function loadScripts($hook){
		wp_enqueue_script('mini_preview_script', plugin_dir_url(__FILE__) . 'mini_preview_script.js');
	}

	public static function loadStyles($hook){
		wp_enqueue_style('mini_preview_style', plugin_dir_url(__FILE__) . 'mini_preview_style.css');
		wp_enqueue_style('load-fa', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
	}

}

function mini_preview_init(){
	add_action('init', array('MiniPreview', 'initSettings'));
	add_action('current_screen', array('MiniPreview', 'init'));

	MiniPreview::removeAdminBar();

	add_action('add_meta_boxes', array('MiniPreview', 'addMetaBox'));
}
mini_preview_init();

?>