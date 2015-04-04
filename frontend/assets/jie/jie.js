
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
		// stop scroll event propagate.
		$(this).find('.jie-overlay-scene').on('wheel', function(e) {
		    var scene = $(this).find('.jie-overlay-scene');
                    height = scene.height()+30;
		    scrollHeight = scene.get(0).scrollHeight;
		    scrollTop=scene.scrollTop();
		    var oEvent = e.originalEvent,
            	    d  = oEvent.deltaY || oEvent.wheelDelta;
		    if((scrollTop >= (scrollHeight - height) && d > 0) || (scrollTop === 0 && d < 0)) {
		      e.preventDefault();
		    }
		  });
		
		$("body").css("overflow", "hidden");
		if ($(".jie-overlay-scene").height()<700) {
			$(".jie-overlay-scene").css('height','700px');
		}
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
		$("body").css("overflow", "scroll");
	});
	$(".jie-overlay-esc").click(function(){
		$(".jie-overlay").trigger('jie_overlay_hide');
		$("body").css("overflow", "scroll");
	});
});

/* End jie-scene. */

