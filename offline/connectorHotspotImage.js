modelfilestrs['connectorHotspotImage'] = hereDoc(function(){/*!
<script type="text/javascript">

	// HTML5 version currently ignores imageTransition optional property
	// These properties are currently ignored as they're for desktop Xerte only:	reportTitle, pageLabel, titleLabel, idLabel
	
	// pageChanged & sizeChanged functions are needed in every model file
	// other functions for model should also be in here to avoid conflicts
	var connectorHotspotImage = new function() {
		var	$img,
			$pageContents;
		
		// function called every time the page is viewed after it has initially loaded
		this.pageChanged = function() {
			$img = $("#image");
			$pageContents = $("#pageContents");
			
			$("#pageContents .selected").removeClass("selected");
			$("#pageContents .highlighted").removeClass("highlighted");
			$("#feedback").html("");
			$(".x_popupDialog").parent().detach(); // remove any open dialogs
		}
		
		// function called every time the size of the LO is changed
		this.sizeChanged = function() {
            $img.css({
				"opacity"	:0,
				"filter"	:'alpha(opacity=0)'
			});
			this.resizeImg(false);
		}
		
		this.init = function() {
			$img = $("#image");
			$pageContents = $("#pageContents");

			if (x_currentPageXML.getAttribute("textWidth") == "none") {
				$("#mainText").remove();
				$("#pageContents").css("text-align", "center");
				// Remove panel
				//$("#panel").removeClass("inline");
				$("#panel").removeClass("panel");
			} else {
				$("#mainText").html(x_addLineBreaks(x_currentPageXML.getAttribute("text")));
				
				if (x_currentPageXML.getAttribute("align") == "Right") {
					$("#panel").addClass("left");
				} else {
					$("#panel").addClass("right");
				}
			}
			
			// set up dialog object for later if it hasn't already been set up on another page of this type
			// xenith.js contains the function used for creating/attaching dialogs - x_openDialog()
			var newDialog = true;
			$(x_dialogInfo).each(function(i) {
				if (this.type == "connectorHotspotImage") {
					newDialog = false;
				}
			});
			if (newDialog == true) {
				var dialog = new Object();
				dialog.type = "connectorHotspotImage";
				dialog.built = false;
				x_dialogInfo.push(dialog);
			}
			
			// deprecated
			
			
			$img
				.css({
						"opacity"	:0,
						"filter"	:'alpha(opacity=0)'
				})
				.one("load", function() {
					connectorHotspotImage.resizeImg(true);
					
					// call this function in every model once everything's loaded
					x_pageLoaded();
				})
				.attr({
					"src"	:x_evalURL(x_currentPageXML.getAttribute("url")),
					"alt"	:x_currentPageXML.getAttribute("tip")
				})
				.each(function() { // called if loaded from cache as in some browsers load won't automatically trigger
					if (this.complete) {
						$(this).trigger("load");
					}
				});
			
			// get feedback text if authorSupport is on
			if (x_params.authorSupport == "true") {
				$pageContents.data("authorSupport", x_currentPageXML.getAttribute("notFoundMessage") != undefined ? x_currentPageXML.getAttribute("notFoundMessage") : "could not be found in this project.");
			} else {
				$("#feedback").remove();
			}
			
			// get info about dialog popups ready
			var dialogPos = {left:"center", top:"middle", width:undefined, height:undefined};
			if (x_currentPageXML.getAttribute("popUpHAlign") != undefined && x_currentPageXML.getAttribute("popUpHAlign") != "") {
				dialogPos.left = x_currentPageXML.getAttribute("popUpHAlign");
			}
			if (x_currentPageXML.getAttribute("popUpVAlign") != undefined && x_currentPageXML.getAttribute("popUpVAlign") != "") {
				dialogPos.top = x_currentPageXML.getAttribute("popUpVAlign");
			}
			$pageContents.data({
				"dialogPos":dialogPos,
				"continueBtnTxt":x_currentPageXML.getAttribute("continueBtnTxt") != undefined ? x_currentPageXML.getAttribute("continueBtnTxt") : "Close"
			});
		}
		this.resizeImg = function(firstLoad) {
			var imgMaxW, imgMaxH;
			if (x_currentPageXML.getAttribute("textWidth") == "none") {
				imgMaxW = Math.round($x_pageHolder.width() - 30);
				imgMaxH = Math.round($x_pageHolder.height() - 30);
				$('#panel').css('margin', '0px');
			} else if (x_currentPageXML.getAttribute("textWidth") == "narrow") {
				imgMaxW = Math.round($x_pageHolder.width() * 0.8 - 20);
				imgMaxH = Math.round($x_pageHolder.height() - 50);
			} else if (x_currentPageXML.getAttribute("textWidth") == "max") {
				imgMaxW = Math.round($x_pageHolder.width() * 0.3 - 20);
				imgMaxH = Math.round($x_pageHolder.height() - 50);
			} else {
				imgMaxW = Math.round($x_pageHolder.width() * 0.55 - 20);
				imgMaxH = Math.round($x_pageHolder.height() - 50);
			}
			
			x_scaleImg($img, imgMaxW, imgMaxH, true, firstLoad, false);
			
			$img.css({
				"opacity"	:1,
				"filter"	:'alpha(opacity=100)'
			});
			
			this.createHS();
		}
		
		this.createHS = function() {
			// create hotspots - taking scale of image into account
			var scale = $img.width() / $img.data("origSize")[0],
				selected = $("#pageContents .hotspot.selected").length > 0 ? $("#pageContents .hotspot.selected").index() : undefined;
			$("#hsHolder").html("");
			
			$(x_currentPageXML).children()
				.each(function(i){
					var hsType,	// what does hs do when clicked?
						hsInfo;
					
					// open dialog popup
					if (this.getAttribute("hotspotMovie") != undefined && this.getAttribute("hotspotMovie") != "") {
						hsType = "dialog";
						hsInfo = "video";
					} else if (this.getAttribute("hotspotSound") != undefined && this.getAttribute("hotspotSound") != "") {
						hsType = "dialog";
						hsInfo = "sound";
					} else if (this.getAttribute("hotspotPopUp") != undefined && this.getAttribute("hotspotPopUp") != "") {
						hsType = "dialog";
						hsInfo = "text";
					
					// open new window
					} else if (this.getAttribute("htm") != undefined && this.getAttribute("htm") != "") {
						hsType = "newWindow";
						hsInfo = "html";
					} else if (this.getAttribute("windowURL") != undefined && this.getAttribute("windowURL") != "") {
						hsType = "newWindow";
						hsInfo = "url";
					
					// go to page in LO
					} else if (this.getAttribute("destination") != undefined && this.getAttribute("destination") != "") {
						hsType = "pageLink";
						hsInfo = this.getAttribute("destination");
					} else if (this.getAttribute("relNav") != undefined && this.getAttribute("relNav") != "") {
						hsType = "pageLink";
						if (this.getAttribute("relNav") == "first") {
							if ($(x_pageInfo)[0].type == "menu") {
								hsInfo = $(x_pageInfo)[1].linkID;
							} else {
								hsInfo = $(x_pageInfo)[0].linkID;
							}
						} else if (this.getAttribute("relNav") == "last") {
							hsInfo = $(x_pageInfo)[x_pageInfo.length - 1].linkID;
						} else if (this.getAttribute("relNav") == "prev") {
							hsInfo = $(x_pageInfo)[x_currentPage - 1].linkID;
						} else { // next page
							hsInfo = $(x_pageInfo)[x_currentPage + 1].linkID;
						}
					}
				
					var _this = this,
						$hotspot = $('<a class="hotspot transparent" href="#" tabindex="' + (i+1) + '" />');
					
					$hotspot
						.attr("title", this.getAttribute("name"))
						.css({
							width	:Math.round(this.getAttribute("w") * scale) + "px",
							height	:Math.round(this.getAttribute("h") * scale) + "px",
							left	:Math.round(this.getAttribute("x") * scale) + "px",
							top		:Math.round(this.getAttribute("y") * scale) + "px"
							})
						.click(function() {
							// when audio dialogs are closed because another dialog has been opened - stop flash audio playing first
							if ($("#x_connectorHotspotImage #pageAudio .mejs-audio").attr("id") != undefined) {
								var audioRefNum = $("#x_connectorHotspotImage #pageAudio .mejs-audio").attr("id").substring(4);
								$("body div#me_flash_" + audioRefNum + "_container").remove();
							}
							
							$(".x_popupDialog").parent().detach(); // remove any open dialogs
							$("#pageContents .selected").removeClass("selected");
							$("#pageContents .highlighted").removeClass("highlighted");
							
							$(this).addClass("selected");
							$("#feedback").html("");
							
							// go to page in LO
							if (hsType == "pageLink") {
								if (x_lookupPage("linkID", hsInfo) == null) { // destination not found
									if (x_params.authorSupport == "true") {
										$("#feedback").html(hsInfo + " " + $pageContents.data("authorSupport"));
									}
								} else { // go to destination page
									x_navigateToPage(false, {type:"linkID", ID:hsInfo});
								}
							
							// open dialog popup
							} else if (hsType == "dialog") {
								var dialogHtml;
								if (hsInfo == "video") {
									var videoDimensions = [320,240];
									if (_this.getAttribute("movieSize") != "" && _this.getAttribute("movieSize") != undefined) {
										var dimensions = _this.getAttribute("movieSize").split(",");
										if (dimensions[0] != 0 && dimensions[1] != 0) {
											videoDimensions = dimensions;
										}
									}
									var videoTip = "";
									if (_this.getAttribute("tip") != "" &&  _this.getAttribute("tip") != undefined) {
										videoTip = _this.getAttribute("tip");
									}
									
									dialogHtml = '<div id="pageVideo"></div>' +
										'<script type="text/javascript">' +
											'$("#pageVideo")' +
												'.attr("title", "' + videoTip + '")' +
												'.mediaPlayer({' +
													'type			:"video",' +
													'source			:"' + _this.getAttribute("hotspotMovie") + '",' +
													'width			:' + videoDimensions[0] + ',' +
													'height			:' + videoDimensions[1] + ',' +
													'startEndFrame	:[' + Number(_this.getAttribute("startFrame")) + ', ' + Number(_this.getAttribute("endFrame")) + ']' +
												'});' +
										'</' + 'script>'; // broken in to 2 strings to stop unterminated string literal problem
									
									$pageContents.data("dialogPos").width = videoDimensions[0];
									$pageContents.data("dialogPos").height = Number(videoDimensions[1]) + 3;
									
								} else if (hsInfo == "sound") {
									dialogHtml = '<div id="pageAudio"></div>' +
										'<script type="text/javascript">' +
											'$("#pageAudio").mediaPlayer({' +
												'type : "audio",' +
												'source : "' + _this.getAttribute("hotspotSound") + '",' +
												'width : "100%"' +
											'});' +
										'</' + 'script>';
									
									$pageContents.data("dialogPos").width = undefined;
									$pageContents.data("dialogPos").height = x_audioBarH;
									
								} else { // text
									dialogHtml = x_addLineBreaks(_this.getAttribute("hotspotPopUp"));
									$pageContents.data("dialogPos").width = undefined;
									$pageContents.data("dialogPos").height = undefined;
								}
								
								x_openDialog("connectorHotspotImage", "", $pageContents.data("continueBtnTxt"), $pageContents.data("dialogPos"), dialogHtml);
								
								// when audio dialogs are closed with dialog x button - stop flash audio playing first
								if (hsInfo == "sound") {
									var audioRefNum = $("#x_connectorHotspotImage #pageAudio .mejs-audio").attr("id").substring(4);
									$("#x_connectorHotspotImage").parent().on("dialogclose", function() {
										$("body div#me_flash_" + audioRefNum + "_container").remove();
									});
								}
							
							// open new window
							} else if (hsType == "newWindow") {
								var wh = [550,400];
								if (_this.getAttribute("windowWidth") != undefined && _this.getAttribute("windowWidth") != "") {
									wh.splice(0, 1, _this.getAttribute("windowWidth"));
								}
								if (_this.getAttribute("windowHeight") != undefined && _this.getAttribute("windowHeight") != "") {
									wh.splice(1, 1, _this.getAttribute("windowHeight"));
								}
								
								if (hsInfo == "url") {
									var src = _this.getAttribute("windowURL");
									window.open(src, "_blank", "width=" + wh[0] + ", height=" + wh[1]);
								} else {
									var popupWindow = window.open("", "", "width=" + wh[0] + ", height=" + wh[1]);
									popupWindow.document.write(_this.getAttribute("htm"));
									popupWindow.focus();
								}
							}
							})
						.focusin(function() {
							$(this)
								.removeClass("transparent")
								.addClass("highlight");
							})
						.focusout(function() {
							$(this)
								.removeClass("highlight")
								.addClass("transparent");
							})
						.keypress(function(e) {
							var charCode = e.charCode || e.keyCode;
							if (charCode == 32) {
								$(this).trigger("click");
							}
						});
				
					$("#hsHolder").append($hotspot);
				});
			
			var highlightColour = "yellow";
			if (x_currentPageXML.getAttribute("hicol") != undefined && x_currentPageXML.getAttribute("hicol") != "") {
				highlightColour = x_getColour(x_currentPageXML.getAttribute("hicol"));
			}
			$("#pageContents .hotspot").css("border-color", highlightColour);
			if (x_currentPageXML.getAttribute("highlight") == "true") {
				$("#pageContents .hotspot").addClass("highlightBorder");
			}
			
			if (selected != undefined) {
				$("#pageContents .hotspot:eq(" + selected + ")").trigger("click");
			}
		}
	}
	
	connectorHotspotImage.init();
	
</script>


<div id="pageContents">
	
	<div id="panel" class="panel inline">
		<div id="imageHolder">
			<img id="image" />
			<div id="hsHolder"></div>
			<div id="feedback" class="alert" />
		</div>
	</div>
	
	<div id="mainText" tabindex="1"></div>
	
</div>

*/});