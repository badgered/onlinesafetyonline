modelfilestrs['textGraphics'] = hereDoc(function(){/*!
<script type="text/javascript">

	
	// pageChanged & sizeChanged functions are needed in every model file
	// other functions for model should also be in here to avoid conflicts
	var textGraphics = new function() {
		
		// function called every time the page is viewed after it has initially loaded
		this.pageChanged = function() {
			
		}
		
		// function called every time the size of the LO is changed
		this.sizeChanged = function() {
			var $pageImg = $("#pageImg");
			if (x_currentPageXML.getAttribute("imagesize") != "actual size") {
				if ($("#transcriptHolder").length > 0 && $("#transcriptBtn").attr("aria-expanded") == "true") {
					$("#transcriptBtn").click();
					$("#transcript").css("display", "none");
				}
				
				var offset = textGraphics.calculateOffset();
				if (x_currentPageXML.getAttribute("imagesize") != "full screen") {
					$("#imgInnerDiv").css("max-width", x_currentPageXML.getAttribute("align") == "Top" || x_currentPageXML.getAttribute("align") == "Bottom" ? $x_pageHolder.width() - offset[0] : "60%");
				}
				$pageImg.css("max-height", x_browserInfo.mobile == true ? $x_mobileScroll.height() - $x_footerBlock.height() - offset[1] : $x_pageHolder.height() - offset[1]);
				
				if ($("#imgCaption").length > 0) {
					$("#imgCaption").width($pageImg.width());
				}
				
				if ($("#transcriptHolder").length > 0) {
					$("#transcript").width($pageImg.width());
				}
			}
			
			if (x_currentPageXML.getAttribute("sound") != undefined && x_currentPageXML.getAttribute("sound") != "") {
				if ($("#pageAudio .mejs-audio").width() != $pageImg.width()) {
					this.loadAudio();
				}
			}
			
			textGraphics.setUpMagnifier(); // reload magnifier
		}
		
		this.init = function() {
			var $pageContents = $("#pageContents"),
				$textHolder = $("#textHolder"),
				$imgHolder = $("#imgHolder"),
				$imgCaption = $("#imgCaption"),
				$imgInnerDiv = $("#imgInnerDiv"),
				$transcript = $("#transcript"),
				imageSize = x_currentPageXML.getAttribute("imagesize"),
				transcriptTxt = x_currentPageXML.getAttribute("transcript"),
				hidePanel = x_currentPageXML.getAttribute("hidePanel");
			
			if (hidePanel == undefined || (hidePanel == "true" && x_currentPageXML.getAttribute("sound") != undefined && x_currentPageXML.getAttribute("sound") != "" && transcriptTxt != undefined && transcriptTxt != "")) {
				hidePanel = "false";
			}
			$pageContents.data("hidePanel", hidePanel);
			
			
			// text align
			var textAlign = x_currentPageXML.getAttribute("align"); // Left|Right|Top|Bottom
			if (imageSize != "full screen") {
				if (x_browserInfo.mobile == true && textAlign != "Top") {
					textAlign = "Bottom";
				}
				if (textAlign == "Top" || textAlign == "Bottom") {
					if (textAlign == "Top") {
						$pageContents.prepend($textHolder);
					}
					$imgHolder
						.addClass("centerAlign")
						.addClass(textAlign);
				} else if (textAlign == "Right") {
					$imgInnerDiv.addClass("x_floatLeft");
				} else {
					$imgInnerDiv.addClass("x_floatRight");
				}
			} else {
				textAlign = "Top";
				$imgHolder.addClass("centerAlign fullScreen");
				$textHolder.remove();
			}
			
			// transcript stuff
			if (x_currentPageXML.getAttribute("sound") != undefined && x_currentPageXML.getAttribute("sound") != "" && transcriptTxt != undefined && transcriptTxt != "") {
				$imgCaption.addClass("transcript");
				
				$transcript
					.hide()
					.html(x_addLineBreaks(transcriptTxt));
				
				$("#transcriptBtn")
					.button({
						icons:	{secondary:"fa fa-x-btn-hide"},
						label:	(x_currentPageXML.getAttribute("transcriptbuttonlabel") != undefined ? x_currentPageXML.getAttribute("transcriptbuttonlabel") : "Transcript")
					})
					.attr("aria-expanded", false)
					.click(function() {
						$this = $(this);
						if ($this.attr("aria-expanded") == "false") {
							$transcript.slideDown();
							$this
								.attr("aria-expanded", true)
								.button({icons: {secondary:"fa fa-x-btn-show"}});
						} else {
							$transcript.slideUp();
							$this
								.attr("aria-expanded", false)
								.button({icons: {secondary:"fa fa-x-btn-hide"}});
						}
					});
			} else {
				$("#transcriptHolder").remove();
			}
			
			if (x_currentPageXML.getAttribute("caption") != undefined && x_currentPageXML.getAttribute("caption") != "") {
				$imgCaption.html(x_currentPageXML.getAttribute("caption"));
			} else {
				$imgCaption.remove();
			}
			
			if (hidePanel == "true") {
				$imgInnerDiv
					.addClass("noBorder")
					.removeClass("panel")
					.removeClass("inline");
			}
			
			$textHolder.html(x_addLineBreaks(x_currentPageXML.childNodes[0].nodeValue));
			
			$("#pageImg")
				.one("load", function() {
					var $this = $(this);
					$this.data("origSize", [$this.width(), $this.height()]);
					
					var offset = textGraphics.calculateOffset();
					if (imageSize == "actual size") {
						// no scaling
					} else {
						$this.css({
							"max-width": "100%",
							"max-height": x_browserInfo.mobile == true ? $x_mobileScroll.height() - $x_footerBlock.height() - offset[1] : $x_pageHolder.height() - offset[1]
						});
						
						if (imageSize == "full screen") {
							$imgInnerDiv.css({
								"max-width": "100%"
							});
						} else { // auto
							$imgInnerDiv.css({
								"max-width": textAlign == "Top" || textAlign == "Bottom" ? $x_pageHolder.width() - offset[0] : "60%"
							});
						}
					}
					
					$this.css("visibility", "visible");
					
					if ($("#transcriptHolder").length > 0) {
						$transcript.width($this.width());
					}
					if ($imgCaption.length > 0) {
						$imgCaption.width($this.width());
					}
					textGraphics.setUpMagnifier();
					textGraphics.loadAudio();
					x_pageLoaded(); // call this function in every model once everything's loaded
				})
				.attr({
					"src": x_evalURL(x_currentPageXML.getAttribute("url")),
					"alt": x_currentPageXML.getAttribute("tip"),
					"title": x_currentPageXML.getAttribute("tip")
				})
				.each(function() { // called if loaded from cache as in some browsers load won't automatically trigger
					if (this.complete) {
						$(this).trigger("load");
					}
				});
		}
		
		this.loadAudio = function() {
			var soundFile = x_currentPageXML.getAttribute("sound");
			if (soundFile != undefined && soundFile != "") {
				$("#pageAudio").mediaPlayer({
					type: "audio",
					source: soundFile,
					width: $("#pageImg").width()
				});
			}
		}
		
		this.calculateOffset = function() {
			// calculates available space for image
			var $imgInnerDiv = $("#imgInnerDiv");
			var offset = [
				$imgInnerDiv.outerWidth() - $imgInnerDiv.width() + $("#x_pageDiv").outerWidth() - $("#x_pageDiv").width() + 10,
				$imgInnerDiv.outerHeight() - $imgInnerDiv.height() + $("#x_pageDiv").outerHeight() - $("#x_pageDiv").height() + 10
			];
			
			if (x_currentPageXML.getAttribute("sound") != undefined && x_currentPageXML.getAttribute("sound") != "") {
				offset.splice(1, 1, offset[1] + x_audioBarH);
				if (x_currentPageXML.getAttribute("transcript") != undefined && x_currentPageXML.getAttribute("transcript") != "") {
					offset.splice(1, 1, offset[1] + $("#transcriptHolder").outerHeight());
				}
			}
			
			if (x_currentPageXML.getAttribute("caption") != undefined && x_currentPageXML.getAttribute("caption") != "") {
				offset.splice(1, 1, offset[1] + $("#imgCaption").outerHeight());
			}
			return offset;
		}
		
		this.setUpMagnifier = function() {
			if (x_currentPageXML.getAttribute("magnifier") == "true" && x_browserInfo.touchScreen != true) {
				$(".magnifier").remove();
				$(".magnifiedImg").remove();
				
				var $pageImg = $("#pageImg");
				if ($pageImg.data("origSize") != undefined && $pageImg.width() / $pageImg.data("origSize")[0] < 0.8) {
					// don't magnify if not scaled to less that 80% of original image
					$pageImg.imageLens();
				}
			}
		}
	}
	
	textGraphics.init();
	
</script>


<div id="pageContents">
	
	<div id="imgHolder" class="mobileAlign">
		<div id="imgInnerDiv" class="panel inline">
			<img id="pageImg" style="visibility: hidden" />
			<div id="pageAudio"></div>
			<p id="imgCaption"></p>
			<div id="transcriptHolder">
				<button id="transcriptBtn"/>
				<div id="transcript"></div>
			</div>
		</div>
	</div>
	
	<div id="textHolder">
	
	</div>
	
</div>

*/});