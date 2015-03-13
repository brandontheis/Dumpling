
/*
  black overlay, scene.
<div class="jie-overlay">
	<div class="jie-overlay-scene">
		// scene here;
	</div>
</div>
<script>
$(".jie-overlay").trigger('jie_overlay_hide');
$(".jie-overlay").trigger('jie_overlay_show');
</script>
 */
$(window).resize(function(){
	$(".jie-overlay").height($(window).height());
	$(".jie-overlay").width($(window).width());
	margin_top=($(window).height()-$(".jie-overlay-scene").height())/2;
	if (margin_top<0) margin_top=0;
	$(".jie-overlay-scene").css("margin-top",margin_top);
});
$(function(){
	
	$(".jie-overlay").bind('jie_overlay_hide',function(){
		$(".jie-overlay").hide();
	});
	$(".jie-overlay").trigger('jie_overlay_hide');
	$(".jie-overlay").bind('jie_overlay_show',function(){
		$("body").css("overflow", "hidden");
		margin_top=($(window).height()-$(".jie-overlay-scene").height())/2;
		if (margin_top<0) margin_top=0;
		$(".jie-overlay-scene").css("margin-top",margin_top);
		$(".jie-overlay").show();
	});
	$(".jie-overlay-scene").click(function(event) { 
	       event.stopPropagation();
	});
	$(".jie-overlay").click(function(){
		$(".jie-overlay").trigger('jie_overlay_hide');
		$('.jie-overlay-scene').empty();
		$("body").css("overflow", "scroll");
	});
});

/* End jie-scene. */

/* 
 	Keep a div at bottom occupying a certain percentage of window.
 	<div class="jie-buttom-div">
	</div>
	<script>
	$(function(){
		$(".jie-buttom-div").trigger('jie_buttom_div_show',0.2);
	});
		
</script>
 */
$(function(){
	$(".jie-buttom-div").bind('jie_buttom_div_show',function(event,percentage){
		window_height=$(window).height();
		height=window_height*percentage;
		$(".jie-buttom-div").css("top",window_height-height);
		$(".jie-buttom-div").css("height",height);
	});
});
$(window).resize(function(){
	window_height=$(window).height();
	height=window_height*percentage;
	$(".jie-buttom-div").css("top",window_height-height);
	$(".jie-buttom-div").css("height",height);
});

/* End jie-bottom-div */