modelfilestrs['gapFill'] = hereDoc(function(){/*!
<script type="text/javascript">

	
	// pageChanged & sizeChanged functions are needed in every model file
	// other functions for model should also be in here to avoid conflicts
	var gapFill = new function() {
		var labelTxt1,
			labelTxt2,
			labelTxt3,
			targetTxt1,
			targetTxt2,
			tabIndex = 1,
			answerData,
            allDropDownAnswers,
			delimiter,
			casesensitive,
			currvalue,
			correct_answers = 0,
			total = 0,
			labelAnswers = {},
			$pageContents,
			$targetHolder,
			$feedbackTxt;

		// function called every time the page is viewed after it has initially loaded
		this.pageChanged = function() {
			$pageContents = $("#pageContents");
			$targetHolder = $("#targetHolder");
			$feedbackTxt = $("#feedbackTxt");
			casesensitive = x_currentPageXML.getAttribute("casesensitive") != "true" && x_currentPageXML.getAttribute("casesensitive") != "1" ? false : true;
			if (XTGetMode() == "normal") { this.isTracked = true; }; //this.isTracked = false;
			this.hasBeenTracked = false;
			$pageContents.find("#hint").remove();
		}
		
        this.leavePage = function() {
		    if(x_currentPageXML.getAttribute("interactivity") == "Drag Drop")
			{
			    if(!this.hasBeenTracked && this.isTracked){
			        this.dragDropSubmit(true);
				}
			}
			else if(x_currentPageXML.getAttribute("interactivity") == "Fill in Blank"){
		        if(!this.hasBeenTracked && this.isTracked){
		            this.fillInSubmit(true);
				}
			}
			else if (x_currentPageXML.getAttribute("interactivity") == "Drop Down Menu")
            {
                if (!this.hasBeenTracked && this.isTracked){
                    this.dropDownSubmit(true);
                }
            }
        };
		
		// function called every time the size of the LO is changed
		this.sizeChanged = function() {
			var $panel = $("#mainPanel");
			if (x_browserInfo.mobile == false) {
				$panel.height(Math.max(
					$("#targetHolder").height() + $("#labelHolder").height(),
					$x_pageHolder.height() - parseInt($x_pageDiv.css("padding-top")) * 2 - parseInt($panel.css("padding-top")) * 2 - 5
				));
			}
			$pageContents.find("#hint").remove();

			var audioBarW = 0;
			$("#pageContents #audioHolder .mejs-inner .mejs-controls").children().each(function() {
				audioBarW += $(this).outerWidth();
			});
			if (audioBarW - $("#pageContents #audioHolder").parents("#mainPanel").width() < -2 || audioBarW - $("#pageContents #audioHolder").parents("#mainPanel").width() > 2) {
				$x_window.resize();
			}

			$targetHolder.find("input, select").css("font-size", $("#dragDropHolder").css("font-size"));
		}
		
		this.init = function() {
			$pageContents = $("#pageContents");
			$targetHolder = $("#targetHolder");
			$feedbackTxt = $("#feedbackTxt");
			delimiter = x_currentPageXML.getAttribute("answerDelimiter") != undefined && x_currentPageXML.getAttribute("answerDelimiter") != "" ? x_currentPageXML.getAttribute("answerDelimiter")  : ",";
			$pageContents.data({
					"score": 0,
					"attempts": 0
				});

            this.hasBeenTracked = false;
            this.isTracked = false;


			$("#showBtn").hide();
			
			// set panel appearance
			var panelWidth = x_currentPageXML.getAttribute("panelWidth");
			if (panelWidth == "Full") {
				$("#mainText").remove();
				$("#dragDropHolder").appendTo($pageContents);
				$("#pageContents .splitScreen").remove();
			} else {
				$("#mainText").html(x_addLineBreaks(x_currentPageXML.getAttribute("text")));
				if (panelWidth == "Small") {
					$("#pageContents .splitScreen").addClass("large"); // make text area on left large so panel on right is small
				} else if (panelWidth == "Large") {
					$("#pageContents .splitScreen").addClass("small");
				} else {
					$("#pageContents .splitScreen").addClass("medium");
				}
			}
			
			var	origPassage = x_addLineBreaks(x_currentPageXML.getAttribute("passage"));

			if (origPassage.indexOf("<p>") != -1){
				origPassage = origPassage.replace(/<p>/gi,"").replace(/<\/p>/gi,"<br/><br/>");
			}

			var passageArray = origPassage.split(x_currentPageXML.getAttribute("mainDelimiter") != undefined && $.trim(x_currentPageXML.getAttribute("mainDelimiter")) != "" ? x_currentPageXML.getAttribute("mainDelimiter") : "|"),
				markedWord = false,
				i;
			
			answerData = []; // contains array of possible correct texts for blanks
			var dropDownDelimiter,
				dropDownNoise;
			if (x_currentPageXML.getAttribute("interactivity") == "Drop Down Menu") {
				dropDownDelimiter = x_currentPageXML.getAttribute("dropDownDelimiter") != undefined && x_currentPageXML.getAttribute("dropDownDelimiter") != "" ? x_currentPageXML.getAttribute("dropDownDelimiter")  : "/";
				
				if (x_currentPageXML.getAttribute("noise") != undefined && x_currentPageXML.getAttribute("noise") != "") {
					var noiseDelimiter = x_currentPageXML.getAttribute("noiseDelimiter") != "" && x_currentPageXML.getAttribute("noiseDelimiter") != undefined ? x_currentPageXML.getAttribute("noiseDelimiter") : " ";
					dropDownNoise = x_currentPageXML.getAttribute("noise").split(noiseDelimiter);
				}
			}

			// add passage with spaces/comboboxes for marked words
			var gapFillStr = "",
				decodedAnswer;

            allDropDownAnswers = [];
            for (var i=0; i<passageArray.length; i++) {
				tabIndex++;
				if (markedWord == false) {
					gapFillStr += '<span tabindex="' + tabIndex + '">' + passageArray[i] + '</span>';
					markedWord = true;
				} else {
					decodedAnswer = $("<textarea/>").html(passageArray[i]).text();
					if (x_currentPageXML.getAttribute("interactivity") == "Drag Drop") {
						gapFillStr += '<span id="gap' + (i-1)/2 + '" class="target highlight" tabindex="' + tabIndex + '">' + decodedAnswer + '</span>';
						answerData.push(decodedAnswer.split(delimiter));

					} else if (x_currentPageXML.getAttribute("interactivity") == "Drop Down Menu") {
						var allAnswers = decodedAnswer.split(dropDownDelimiter);
						answerData.push(allAnswers[0].split(delimiter));
						
						// options in combo boxes include all correct answers (1st answers separated by delimiter ","), all incorrect answers (subsequent answers separated by dropDownDelimiter "/") & all noise answers (separated by noiseDelimiter)
						// e.g. dog,cat/fish/bird - where dog & cat are possible correct answers & fish & bird are distractors 
						allAnswers = allAnswers.concat(allAnswers[0].split(delimiter));
						allAnswers.splice(0,1);
						if (dropDownNoise != undefined) {
							allAnswers = allAnswers.concat(dropDownNoise);
						}
						allAnswers.sort();
						
						for (var j=0; j<allAnswers.length; j++) {
							while (allAnswers[j] == allAnswers[j+1]) {
								allAnswers.splice(j+1,1);
							}
						}
						allDropDownAnswers.push(allAnswers);
						gapFillStr += '<select id="gap' + (i-1)/2 + '" class="menu" tabindex="' + tabIndex + '">';
						gapFillStr += '<option value=" "> </option>';
						for (var j=0; j<allAnswers.length; j++) {
							gapFillStr += '<option value="' + allAnswers[j] + '">' + allAnswers[j] + '</option>';
						}
						gapFillStr += '</select>';
						
					} else { // fill in the blank
						gapFillStr += '<input type="text" id="gap' + (i-1)/2 + '" value="' + decodedAnswer + '" tabindex="' + tabIndex + '"/>';

						var tempArray = [];
						tempArray = decodedAnswer.split(delimiter);
						if (x_currentPageXML.getAttribute("casesensitive") != "true" && x_currentPageXML.getAttribute("casesensitive") != "1") {
							for (var j=0; j < tempArray.length; j++) {
								tempArray[j] = tempArray[j].toLowerCase();
							}
							casesensitive = false;
						}
						else{
							casesensitive = true;
						}
						answerData.push(tempArray);
					}
					markedWord = false;
				}
			}
			
			var $gapFillTxt = $('<div>' + gapFillStr + '</div>').appendTo($targetHolder);
			$gapFillTxt.find("span.target, input").each(function(i) {
				var $this = $(this);
				if (x_currentPageXML.getAttribute("interactivity") == "Drag Drop") {
					$this.data("answer", $this.html());
					var	answers = $this.html().split(delimiter),
						longest = answers.sort(function (a, b) { return b.length - a.length; })[0];
					$this.html(longest);
				} else if (x_currentPageXML.getAttribute("interactivity") != "Drop Down Menu") {
					var	answers = $this.attr("value").split(delimiter),
						longest = answers.sort(function (a, b) { return b.length - a.length; })[0];
					$this.attr("value", longest);
				}
			});
			
			if (x_currentPageXML.getAttribute("interactivity") == "Drag Drop") {
				this.setUpDragDrop();
			} else if (x_currentPageXML.getAttribute("interactivity") == "Drop Down Menu") {
				this.setUpDropDown();
			} else {
				this.setUpFillBlank();
			}
			
			$feedbackTxt
				.hide()
				.find("#txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
			
			if (x_currentPageXML.getAttribute("audioFeedback") != "" && x_currentPageXML.getAttribute("audioFeedback") != undefined) {
				$("#pageContents #audioHolder").mediaPlayer({
					type	:"audio",
					source	:x_currentPageXML.getAttribute("audioFeedback"),
					width	:"100%"
				});
			} else {
				$("#pageContents #audioHolder").remove();
			}

            this.initTracking();
            if(XTGetMode() == "normal")
            {
                this.isTracked = true;
            }

            // Enter the interactions for this page.
            var interactionNumber,
				name,
				correctAnswer,
				correctAnswers,
				correctOption,
				correctOptions;
			if(x_currentPageXML.getAttribute("interactivity") == "Fill in Blank"){			
				for (interactionNumber=0;  interactionNumber<answerData.length;  interactionNumber++) {
					name = "interaction number" + " " + interactionNumber;
					correctAnswer = answerData[interactionNumber];
					XTEnterInteraction(x_currentPage,  interactionNumber , 'fill-in', name, [], correctAnswer, "Correct", x_currentPageXML.getAttribute("grouping"));
				}
			}
			else if(x_currentPageXML.getAttribute("interactivity") == "Drag Drop"){
			    correctAnswers = [];
                correctOptions = [];
				for (interactionNumber=0;  interactionNumber<answerData.length;  interactionNumber++) {
					name = "interaction number" + " " + interactionNumber;
					correctAnswer = answerData[interactionNumber][0];
					correctAnswer = correctAnswer + "-->" + correctAnswer;
					correctAnswers.push(correctAnswer);
					correctOption = {source: answerData[interactionNumber][0], target: answerData[interactionNumber][0]}
					correctOptions.push(correctOption);
				}
                XTEnterInteraction(x_currentPage,  0 , 'match', name, correctOptions, correctAnswers, "", x_currentPageXML.getAttribute("grouping"));

            }
			else
			{
                for (interactionNumber=0;  interactionNumber<answerData.length;  interactionNumber++) {
                    correctAnswers = [];
                    correctOptions = [];
                    name = "interaction number" + " " + interactionNumber;
                    for (var i=0; i<answerData[interactionNumber].length; i++) {
                        correctAnswers.push(answerData[interactionNumber][i]);
                    }
                    for (var i=0; i<allDropDownAnswers[interactionNumber].length; i++)
					{
					    var correctAnswer = false;

					    var p = answerData[interactionNumber].indexOf(allDropDownAnswers[interactionNumber][i]);
                        if (p >=0)
                        {
                            correctAnswer = true;
                        }

                        correctOptions.push({
                            id: (i + 1) + "",
                            answer: allDropDownAnswers[interactionNumber][i],
                            result: correctAnswer
                        });
					}
                    XTEnterInteraction(x_currentPage,  interactionNumber , 'multiplechoice', name, correctOptions, correctAnswers, "Correct", x_currentPageXML.getAttribute("grouping"));
                }
			}
			
			this.sizeChanged();
			x_pageLoaded();
						
		}
		
		this.setUpDropDown = function() {
			tabIndex++;
			$("#labelHolder").remove();
			
			$("#submitBtn")
				.button({
					label:	x_currentPageXML.getAttribute("checkBtn") != undefined && x_currentPageXML.getAttribute("checkBtn") != "" ? x_currentPageXML.getAttribute("checkBtn") : "Check"
				})
				.attr("tabindex",tabIndex)
				.click(function() {
                    if(!this.hasBeenTracked){
                        gapFill.dropDownSubmit();
                    }

				});
			
			$("#showBtn")
				.button({
					label:	x_currentPageXML.getAttribute("showBtn") != undefined && x_currentPageXML.getAttribute("showBtn") != "" ? x_currentPageXML.getAttribute("showBtn") : "Show Answers"
				})
				//.attr("tabindex",tabIndex) // **
				.click(function() {
					var wrong = 0;
					$targetHolder.find("select").each(function(i) {
						var $this = $(this);
						if ($.inArray($this.val(), answerData[i]) != -1) {
							$this.attr("disabled", "disabled");
						} else {
							$this
								.val(answerData[i][0])
								.attr("disabled", "disabled")
								.addClass("answerShown");
						}
					
					$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
					});
					
					$(this).hide();
					$("#submitBtn").hide();
				});
			
			$targetHolder.find("select").on("change", function() {
				$feedbackTxt.hide();
			});
			
			$feedbackTxt.attr("tabindex", tabIndex+1);
		}
		
		this.setUpFillBlank = function() {
			$("#labelHolder").remove();

			var	maxW = 0,
				i;
			for (i=0; i<$targetHolder.find("input").length; i++) {
				maxW = Math.max(maxW, $targetHolder.find("input:eq(" + i + ")").val().length);
			}
			
			$targetHolder.find("input")
				.attr({
					"size"		:maxW + 2,
					"maxlength"	:maxW + 2,
					"value"		:""
				})
				.each(function() {
					$(this).data("index", $targetHolder.find("input").index($(this))); // stored here as using .index() won't return result needed as there are other elements (line breaks etc.) in $targetHolder
				});
				
			if ((x_currentPageXML.getAttribute("markEnd") == undefined || x_currentPageXML.getAttribute("markEnd") == "false") && !this.isTracked) {
				$("#submitBtn").remove();

				$targetHolder.find("input")
					.addClass("incorrect")
					.on("keypress", function() {
						var $this = $(this);

						setTimeout(function() {
							currvalue = $this.val();
							if (!casesensitive) {
								currvalue = $this.val().toLowerCase();
							}
							if (answerData[$this.data("index")].indexOf(currvalue) != -1) { // correct
								$this
									.attr("readonly", "readonly")
									.removeClass("incorrect");
								
								$pageContents.find("#hint").remove();

								if ($targetHolder.find("input[readonly]").length == $targetHolder.find("input").length) {
									$feedbackTxt.fadeIn();
								}

							} else { // wrong - start showing hint after 3 wrong characters entered - this only gives hint if there's only 1 possible correct answer for the gap
								if (x_currentPageXML.getAttribute("showHint") != "false") {
									var wrong = 0;
									for (i=0; i<$this.val().length; i++) {
										if (answerData[$this.data("index")].length == 1 && (i+1 > answerData[$this.data("index")][0].length || currvalue[i] != answerData[$this.data("index")][0][i])) {
											wrong++;
										}
									}

									if (wrong > 0) {
										if ($this.data("attempt") == undefined) {
											$this.data("attempt", 1);

										} else if ($this.data("attempt") >= (x_currentPageXML.getAttribute("attemptsBeforeHint") != undefined && $.isNumeric(x_currentPageXML.getAttribute("attemptsBeforeHint")) ? Number(x_currentPageXML.getAttribute("attemptsBeforeHint")) : 2)) {
											// show hint - add extra letter at every other wrong answer
											$this.data("attempt", $this.data("attempt")+1);
											if ($this.data("attempt") % 2 != 0) { // odd num
												var currentHint = $this.data("hint"),
														correctAnswer = answerData[$this.data("index")][0];

												if (currentHint == undefined) { // show 1st letter
													currentHint = "";
													for (i=0; i<correctAnswer.length; i++) {
														if (i == 0) {
															currentHint += correctAnswer[i];
														} else {
															currentHint += "_";
														}
													}

												} else if (currentHint[currentHint.length - 1] == "_") { // then last letter
													currentHint = currentHint.substring(0, currentHint.length - 1) + correctAnswer[correctAnswer.length - 1];

												} else { // then random letter in between
													var blanks = currentHint.match(/_/g); // num of blanks

													if (blanks != null && blanks.length >= 1) {
														var	letterToShow = Math.floor(Math.random() * blanks.length),
																tempCount = 0;
														for (i=0; i<currentHint.length; i++) {
															if (currentHint[i] == "_" && tempCount == letterToShow) {
																currentHint = currentHint.substring(0, i) + correctAnswer[i] + currentHint.substring(i + 1, currentHint.length);
																break;
															} else if (currentHint[i] == "_") {
																tempCount++;
															}
														}
													}
												}

												$this
														.data("hint", currentHint)
														.attr("title", currentHint);

												var $hint = $pageContents.find("#hint");
												if ($hint.length < 1) {
													$pageContents.append('<div id="hint" class="x_tooltip"></div>');
													$hint = $pageContents.find("#hint");
												}
												$hint.html(currentHint);

												$hint.css({
													top	 :$this.position().top + parseInt($("#mainPanel").css("padding-top")) + parseInt($this.css("margin-top")) + $this.height() + 10,
													left :$this.position().left + parseInt($("#mainPanel").css("padding-left")) + 5
												});
											}

										} else {
											$this.data("attempt", $this.data("attempt")+1);
										}
									}
								}
							}
						}, 0);
					});
				
			} else {
				// when mark at end have show answers button instead of a hint
				tabIndex++;
				
				$targetHolder.find("input")
					.on("keypress focus", function() {
						$(this).removeAttr("incorrect");
					});
				
				$("#submitBtn")
					.button({
						label:	x_currentPageXML.getAttribute("checkBtn") != undefined && x_currentPageXML.getAttribute("checkBtn") != "" ? x_currentPageXML.getAttribute("checkBtn") : "Check"
					})
					.attr("tabindex",tabIndex)
					.click(function() {
					    if(!this.hasBeenTracked){
                            gapFill.fillInSubmit(false);
						}
					});
				
				$("#showBtn")
					.button({
						label:	x_currentPageXML.getAttribute("showBtn") != undefined && x_currentPageXML.getAttribute("showBtn") != "" ? x_currentPageXML.getAttribute("showBtn") : "Show Answers"
					})
					//.attr("tabindex",tabIndex) // **
					.click(function() {
						 $targetHolder.find("input").each(function() {
							var $this = $(this),
								currvalue = !casesensitive ? $this.val().toLowerCase() : $this.val();
							
							if (answerData[$this.data("index")].indexOf(currvalue) != -1) {
								$this.attr("readonly", "readonly");
								$this.attr("correct", "correct");
							} else {
								$this.val(answerData[$this.data("index")][0]);
								$this.addClass("answerShown");
							}
						});
						
						$(this).hide();
						$("#submitBtn").hide();
						$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
					});
				
				$targetHolder.find("input").on("keypress", function() {
					$feedbackTxt.hide();
				});
			}
			
			$feedbackTxt.attr("tabindex", tabIndex+1);
		}
		
		this.setUpDragDrop = function() {
			
			// if mark at end is off but tracking is on then it will mark at end anyway
			if (!this.isTracked && (x_currentPageXML.getAttribute("markEnd") == undefined || x_currentPageXML.getAttribute("markEnd") == "false")) {
                $("#submitBtn").hide();
				
			} else {
				$("#submitBtn")
					.button({
						label:	x_currentPageXML.getAttribute("checkBtn") != undefined && x_currentPageXML.getAttribute("checkBtn") != "" ? x_currentPageXML.getAttribute("checkBtn") : "Check"
					})
					.attr("tabindex",tabIndex)
					.click(function() {
						if(!this.hasBeenTracked){
						    gapFill.dragDropSubmit();
						}
					});
				
				$("#showBtn")
					.button({
						label:	x_currentPageXML.getAttribute("showBtn") != undefined && x_currentPageXML.getAttribute("showBtn") != "" ? x_currentPageXML.getAttribute("showBtn") : "Show Answers"
					})
					//.attr("tabindex",tabIndex) // **
					.click(function() {
						var $incorrectTargets = $("#targetHolder .target").filter(function () {
							return $(this).data("correct") != true;
						});
						
						$incorrectTargets
							.addClass("answerShown")
							.removeClass("highlight highlightDark ui-state-disabled")
							.removeAttr("title")
							.off("keypress focusin focusout")
							.each(function() {
								$(this).html($(this).data("answer"));
							});
						
						$("#labelHolder").hide();
						
						$(this).hide();
						$("#submitBtn").hide();
						$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
					});
			}
			
			// store strings used to give titles to labels and targets when keyboard is being used (for screen readers)
			labelTxt1 = x_getLangInfo(x_languageData.find("interactions").find("draggableItem")[0], "name", "Draggable Item");
			labelTxt2 = x_getLangInfo(x_languageData.find("interactions").find("draggableItem")[0], "selected", "Item Selected");
			labelTxt3 = x_getLangInfo(x_languageData.find("interactions").find("draggableItem")[0], "toSelect", "Press space to select");
			targetTxt1 = x_getLangInfo(x_languageData.find("interactions").find("targetArea")[0], "description", "Drop zone for");
			targetTxt2 = x_getLangInfo(x_languageData.find("interactions").find("targetArea")[0], "toSelect", "Press space to drop the selected item.");
			
			// set up targets
			var	maxW = 0,
				i;
			for (i=0; i<$targetHolder.find(".target").length; i++) {
				maxW = Math.max(maxW, $targetHolder.find(".target:eq(" + i + ")").width());
			}
			
			$($targetHolder.find(".target")).each(function(i) {
				$(this)
					.attr("title", targetTxt1 + " " + (i + 1))
					.data("index", i); // stored here as using .index() won't return result needed as there are other elements (line breaks etc.) in $targetHolder
			});
			
			$targetHolder.find(".target")
				.css({
					"width":maxW + 30,
					"height":$targetHolder.find(".target").height() + 10,
					"line-height":$targetHolder.find(".target").height() + 10 + "px"
					})
				.html("")
				.droppable({
					drop:	function(event, ui) {
						gapFill.dropLabel($(this), ui.draggable); // target, label
					}
					});
			
			this.setUpTargetListeners($targetHolder.find(".target"));
			
			var allLabels = answerData.slice();
			
			// set up labels
			if (x_currentPageXML.getAttribute("noise") != undefined && x_currentPageXML.getAttribute("noise") != "") { // save distractor data
				var noiseDelimiter = x_currentPageXML.getAttribute("noiseDelimiter") != "" && x_currentPageXML.getAttribute("noiseDelimiter") != undefined ? x_currentPageXML.getAttribute("noiseDelimiter") : " ",
					distractors = x_currentPageXML.getAttribute("noise").split(noiseDelimiter);
				for (i=0; i<distractors.length; i++) { // add distractors
					allLabels.push([distractors[i]]);
				}
			}
			
			// create labels and then randomise them
			var	tempMultiAnswers = [];
			
			for (i=0; i<allLabels.length; i++) {
				var arrayString = "";
				for (var j=0; j<allLabels[i].length; j++) {
					if (j != 0) {
						arrayString += delimiter;
					}
					arrayString += allLabels[i][j];
				}
				
				// where there are multiple gaps where the answers can be placed in any order, only create the labels for these once
				if (tempMultiAnswers.indexOf(arrayString) == -1) {
					for (var j=0; j<allLabels[i].length; j++) {
						$('<div class="label panel" title="' + labelTxt1 + '">' + allLabels[i][j] + '</div>')
							.appendTo($("#labelHolder"))
							.data("answer", arrayString);
					}
					if (allLabels[i].length > 1) {
						tempMultiAnswers.push(arrayString);
					}
				}
			}
			var labels = $("#labelHolder .label").sort(function() { return (Math.round(Math.random())-0.5); });
			for (var i=0; i<labels.length; i++) {
				tabIndex++;
				$(labels[i])
					.appendTo($("#labelHolder"))
					.attr({
						"id":		"index" + i,
						"tabindex":	tabIndex
					});
			}
			
			// set up drag events (mouse and keyboard controlled)
			$("#dragDropHolder .label")
				.draggable({
					containment:	"#dragDropHolder",
					stack:			"#dragDropHolder .label", // item being dragged is always on top (z-index)
					revert:			"invalid", // snap back to original position if not dropped on target
					start:			function() {
						// remove any focus/selection highlights made by tabbing to labels/targets
						if ($("#labelHolder .label.focus").length > 0) {
							$("#labelHolder .label.focus").attr("title", labelTxt1);
						}
						if ($pageContents.data("selectedLabel") != undefined && $pageContents.data("selectedLabel") != "") {
							$pageContents.data("selectedLabel").attr("title", labelTxt1);
							$pageContents.data("selectedLabel", "");
						}
						var targetInFocus = $("#targetHolder .target.highlightDark");
						if (targetInFocus.length > 0) {
							targetInFocus.attr("title", targetTxt1 + " " + (targetInFocus.index() + 1));
						}
						$("#dragDropHolder .selected").removeClass("selected");
						$("#dragDropHolder .focus").removeClass("focus");
						$("#dragDropHolder .highlightDark").removeClass("highlightDark");
					}
					})
				.disableSelection();
			
			this.setUpLabelListeners($("#dragDropHolder .label"));
			
			for (i=0; i<$("#targetHolder .target").length; i++) {
				$("#targetHolder .target:eq(" + i + ")").droppable({
					accept:	(!this.isTracked && (x_currentPageXML.getAttribute("markEnd") == undefined || x_currentPageXML.getAttribute("markEnd") == "false")) ?
						$("#labelHolder .label").filter(function() {
							return $(this).data("answer") == $("#targetHolder .target:eq(" + i + ")").data("answer");
						}) : $("#labelHolder .label")
				});
			}
			
			$feedbackTxt.attr("tabindex", tabIndex+1);
		}
		
		// function called when label dropped on target - by mouse or keyboard
		this.dropLabel = function($thisTarget, $thisLabel) {
			$feedbackTxt.hide();
			
			$thisLabel
				.removeAttr("title")
				.removeClass("selected")
				.draggable("disable")
				.off("keypress focusin focusout")
				.css("opacity", 0);
			
			if (this.isTracked || x_currentPageXML.getAttribute("markEnd") == "true") {
				if ($thisLabel.data("answer") == $thisTarget.data("answer")) {
					$pageContents.data("score", $pageContents.data("score") + 1);
					$thisLabel.add($thisTarget).data("correct", true);
				}
			} else {
				$thisTarget.addClass("correct");
			}
			
			$thisTarget
				.removeAttr("title")
				.html($thisLabel.html())
				.off("keypress focusin focusout")
				.droppable("option", "disabled", true)
				.removeClass("highlight highlightDark ui-state-disabled");
			
			$pageContents.data("selectedLabel", "");

			labelAnswers[$thisTarget.data("answer")]= $thisLabel.data("answer");

			// if it's marked as completed (can only drop on correct targets) then show feedback immediately when complete
			if (!this.isTracked && (x_currentPageXML.getAttribute("markEnd") != "true" && $targetHolder.find(".target.highlight").length == 0)) {
				$("#labelHolder").hide();
				$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
				$feedbackTxt.fadeIn();
			}
			
//			if ($targetHolder.find(".target.highlight").length == 0 && (this.isTracked || (x_currentPageXML.getAttribute("markEnd") == "true"))) {
//				if (x_currentPageXML.getAttribute("markEnd") == "true") {
//					$("#targetHolder .target").filter(function() { return $(this).data("correct") == true; })
//						.addClass("correct");
//
//					if (score == $("#targetHolder .target").length) {
//						$("#labelHolder").hide();
//						$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
//						$feedbackTxt.fadeIn();
//					} else {
//						if (score == 0) {
//							$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillWrong") != undefined && x_currentPageXML.getAttribute("gapFillWrong") != "" ? x_currentPageXML.getAttribute("gapFillWrong") : "You have not filled any gaps correctly. Try again."));
//							$feedbackTxt.fadeIn();
//						} else {
//							$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillPartWrong") != undefined && x_currentPageXML.getAttribute("gapFillPartWrong") != "" ? x_currentPageXML.getAttribute("gapFillPartWrong") : "Your correct answers are shown in green. Try again with those you have got wrong."));
//							$feedbackTxt.fadeIn();
//						}
//
//
//							var $targets = $("#targetHolder .target").filter(function () {
//								return $(this).data("correct") != true;
//							});
//
//							$targets.each(function () {
//								var $this = $(this);
//								$this
//										.attr("title", targetTxt1 + " " + ($this.data("index") + 1))
//										.html("")
//										.droppable("option", "disabled", false)
//										.addClass("highlight");
//
//								gapFill.setUpTargetListeners($targets);
//							});
//
//							var $labels = $("#labelHolder .label").filter(function () {
//										return $(this).data("correct") != true;
//									})
//									.attr("title", labelTxt1)
//									.draggable("enable")
//									.css({
//										"opacity": 1,
//										"left": "auto",
//										"top": "auto"
//									});
//
//							this.setUpLabelListeners($labels);
//
//					}
//				} else {
//					$("#labelHolder").hide();
//					$feedbackTxt.fadeIn();
//				}
//			}
		}


		
		// set up events used when keyboard rather than mouse is used
		this.setUpTargetListeners = function($targets) {
			$targets
				.focusin(targetFocusIn)
				.focusout(targetFocusOut)
				.keypress(targetKeyPress);
		}
		
		var targetFocusIn = function(e) {
			var $this = $(this);
			$this.addClass("highlightDark");
			if ($pageContents.data("selectedLabel") != undefined && $pageContents.data("selectedLabel") != "") {
				$this.attr("title", targetTxt1 + " " + ($this.data("index") + 1) + " - " + targetTxt2);
			}
		}
		
		var targetFocusOut = function(e) {
			var $this = $(this);
			$this
				.removeClass("highlightDark")
				.attr("title", targetTxt1 + " " + ($this.data("index") + 1));
		}
		
		var targetKeyPress = function(e) {
			var charCode = e.charCode || e.keyCode;
			if (charCode == 32) {
				var $selectedLabel = $pageContents.data("selectedLabel");
				if ($selectedLabel != undefined && $selectedLabel != "") {
					if (answerData[$(this).data("index")].indexOf($selectedLabel.html()) != -1 || (x_currentPageXML.getAttribute("markEnd") != undefined && x_currentPageXML.getAttribute("markEnd") != "false") || (this.isTracked)) {
						gapFill.dropLabel($(this), $selectedLabel); // target, label
					} else {
						$(this).attr("title", targetTxt1 + " " + ($(this).data("index") + 1));
						$selectedLabel
							.removeClass("selected")
							.attr("title", labelTxt1);
						$pageContents.data("selectedLabel", "");
					}
				}
			}
		}
		
		// set up events used when keyboard rather than mouse is used
		this.setUpLabelListeners = function($labels) {
			// highlight selected labels / targets and set the title attr which the screen readers will use
			$labels
				.focusin(labelFocusIn)
				.focusout(labelFocusOut)
				.keypress(labelKeyPress);
		}
		
		var labelFocusIn = function(e) {
			var $this = $(this);
			if ($this.is($pageContents.data("selectedLabel")) == false) {
				$this
					.addClass("focus")
					.attr("title", labelTxt1 + " - " + labelTxt3);
			}
		}
		
		var labelFocusOut = function(e) {
			var $this = $(this);
			$this.removeClass("focus");
			if ($this.is($pageContents.data("selectedLabel")) == false) {
				$this.attr("title", labelTxt1);
			}
		}
		
		var labelKeyPress = function(e) {
			var charCode = e.charCode || e.keyCode;
			if (charCode == 32) {
				if ($pageContents.data("selectedLabel") != undefined && $pageContents.data("selectedLabel") != "") {
					$pageContents.data("selectedLabel")
						.removeClass("selected")
						.attr("title", labelTxt1);
				}
				var $this = $(this);
				$this
					.removeClass("focus")
					.addClass("selected")
					.attr("title", labelTxt1 + ' - ' + labelTxt2);
				$pageContents.data("selectedLabel", $this);
			}
		};

		this.dropDownSubmit = function()
        {
            var wrong = 0,
                correct,
                result,
                answer,
                answers,
                feedback,
                options;

            total=0;
            correct_answers=0;
            $targetHolder.find("select").each(function(i) {
                var $this = $(this);
                answers = [];
                options = [];
                feedback= [];
                answer = $this.val();
                total++;
                if ($.inArray($this.val(), answerData[i]) != -1) {
                    $this.attr("disabled", "disabled");
                    correct = true;
                    correct_answers++;
                } else {
                    wrong++;
                    correct = false;
                }
                answers.push(answer);
                result = {
                    success: correct,
                    score: (correct ? 100.0 : 0.0)
                };
                // Loop over options
                $this.find(":selected").each(function(j) {
                    $this = $(this);
                    options.push({
                        id: $.inArray($this.val(), allDropDownAnswers[i]) + 1 + "",
                        answer: $this.val(),
                        result: ($.inArray($this.val(), answerData[i]) != -1)
                    });
                });
                XTExitInteraction(x_currentPage, i, result, options, answers, feedback, x_currentPageXML.getAttribute("trackinglabel"));
            });


            gapFill.finishTracking();
            this.hasBeenTracked = true;

            if (wrong == 0) {
                $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
                $feedbackTxt.fadeIn();
                $(this).hide();
            } else {
                if (x_currentPageXML.getAttribute("showHint") != "false") {
                    $targetHolder.find("select").each(function() {
                        if ($(this).val() != " ") {
                            $pageContents.data("attempts", $pageContents.data("attempts")+1);
                            if ($pageContents.data("attempts") >= (x_currentPageXML.getAttribute("attemptsBeforeHint") != undefined && $.isNumeric(x_currentPageXML.getAttribute("attemptsBeforeHint")) ? Number(x_currentPageXML.getAttribute("attemptsBeforeHint")) : 2)) {
                                $("#showBtn").show();
                            }
                            return false;
                        }
                    });
                }

                if (wrong == $targetHolder.find("select").length) {
                    $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillWrong") != undefined && x_currentPageXML.getAttribute("gapFillWrong") != "" ? x_currentPageXML.getAttribute("gapFillWrong") : "You have not filled any gaps correctly. Try again."));
                } else {
                    $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillPartWrong") != undefined && x_currentPageXML.getAttribute("gapFillPartWrong") != "" ? x_currentPageXML.getAttribute("gapFillPartWrong") : "Your correct answers are shown in green. Try again with those you have got wrong."));
                }
                $feedbackTxt.fadeIn();
            }
        };

		this.fillInSubmit = function(){
            var empty = 0;
            $targetHolder.find("input").each(function() {
                if ($(this).val() == "") {
                    empty += 1;
                }
            });
			
			if (empty > 0) {
				$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillIncomplete") != undefined && x_currentPageXML.getAttribute("gapFillIncomplete") != "" ? x_currentPageXML.getAttribute("gapFillIncomplete") : "Please complete the exercise."));
                $feedbackTxt.fadeIn();
			} else {
				if (x_currentPageXML.getAttribute("showHint") != "false") {
					$("#pageContents").data("attempts", $("#pageContents").data("attempts")+1);
					if ($("#pageContents").data("attempts") >= (x_currentPageXML.getAttribute("attemptsBeforeHint") != undefined && $.isNumeric(x_currentPageXML.getAttribute("attemptsBeforeHint")) ? Number(x_currentPageXML.getAttribute("attemptsBeforeHint")) : 2)) {
						$("#showBtn").show();
					}
				}
				
                var wrong = 0;
				
                $targetHolder.find("input").each(function() {
                    var $this = $(this),
                        currvalue = !casesensitive ? $this.val().toLowerCase() : $this.val();
                    var feedback = "Incorrect"
                    var correct = false;
                    var answer = currvalue;

                    if (answerData[$this.data("index")].indexOf(currvalue) != -1) { // correct
                        $this.attr("readonly", "readonly");
                        $this.attr("correct", "correct");
                        feedback = "Correct";
                        correct = true;
                        correct_answers++;

                    } else {
                        if(XTGetMode() == "normal") $this.attr("readonly", "readonly");
                        $this.attr("incorrect", "incorrect");
                        wrong++;
                    }

                    total++;
                    var result = {
                        success: correct,
						score: (correct ? 100.0 : 0.0)
					};
                    XTExitInteraction(x_currentPage, $this.data("index") , result, [], answer, feedback, x_currentPageXML.getAttribute("trackinglabel"));

                });

                gapFill.finishTracking();
                this.hasBeenTracked = true;
				
                if (XTGetMode() == "normal") {
                    if (wrong == 0) {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
                        $feedbackTxt.fadeIn();
						$("#showBtn,#submitBtn").hide();
                    } else if (wrong == $targetHolder.find("input").length) {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillWrongTracking") != undefined && x_currentPageXML.getAttribute("gapFillWrongTracking") != "" ? x_currentPageXML.getAttribute("gapFillWrongTracking") : "You have not filled any gaps correctly."));
                        $feedbackTxt.fadeIn();
                    } else {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillPartWrongTracking") != undefined && x_currentPageXML.getAttribute("gapFillPartWrongTracking") != "" ? x_currentPageXML.getAttribute("gapFillPartWrongTracking") : "Your correct answers are shown in green."));
                        $feedbackTxt.fadeIn();
                    }
                } else {
                    if (wrong == 0) {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
                        $feedbackTxt.fadeIn();
						$("#showBtn,#submitBtn").hide();
                    } else if (wrong == $targetHolder.find("input").length) {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillWrong") != undefined && x_currentPageXML.getAttribute("gapFillWrong") != "" ? x_currentPageXML.getAttribute("gapFillWrong") : "You have not filled any gaps correctly. Try again."));
                        $feedbackTxt.fadeIn();
                    } else {
                        $("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillPartWrong") != undefined && x_currentPageXML.getAttribute("gapFillPartWrong") != "" ? x_currentPageXML.getAttribute("gapFillPartWrong") : "Your correct answers are shown in green. Try again with those you have got wrong."));
                        $feedbackTxt.fadeIn();
                    }
                }
				
                // Hide the button so only one submission can be made whilst tracking.
                if(XTGetMode() == "normal"){
                    $(this).hide();
                }
				this.hasBeenTracked = true;
            }
		};
		this.dragDropSubmit = function(forceTracking) {
			var score = $pageContents.data("score"),
				completeItPlease = false;
			
			// no blanks completed
			if ($targetHolder.find(".target:not(.highlight)").length == 0) {
				$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillIncomplete") != undefined && x_currentPageXML.getAttribute("gapFillIncomplete") != "" ? x_currentPageXML.getAttribute("gapFillIncomplete") : "Please complete the exercise."));
				$feedbackTxt.fadeIn();
				
			} else if ($targetHolder.find(".target.highlight").length == 0 || forceTracking || !this.isTracked) {
				$("#targetHolder .target").filter(function () {
					return $(this).data("correct") == true;
				}).addClass("correct");
				
				var $incorrectTargets = $("#targetHolder .target").filter(function () {
					return $(this).data("correct") != true && !$(this).hasClass("highlight");
				});
				
				var $incorrectLabels = $("#labelHolder .label").filter(function () {
					return $(this).data("correct") != true;
				});
				
				if (!this.isTracked) {
					// reset incorrect labels so you can try again
					$incorrectTargets
						.html("")
						.focusin(targetFocusIn)
						.focusout(targetFocusOut)
						.keypress(targetKeyPress)
						.droppable("option", "disabled", false)
						.addClass("highlight");
					
					$incorrectTargets.each(function() {
						$(this).attr("title", targetTxt1 + " " + ($(this).data("index") + 1));
						delete labelAnswers[$(this).data("answer")];
					});
					
					$incorrectLabels
						.attr("title", labelTxt1)
						.draggable("option", "disabled", false)
						.focusin(labelFocusIn)
						.focusout(labelFocusOut)
						.keypress(labelKeyPress)
						.css({
							"opacity": 1,
							"left": "auto",
							"top": "auto"
						});
					
					if ($targetHolder.find(".target.highlight").length == 0) {
						$("#submitBtn, #showBtn").hide();
					} else if (x_currentPageXML.getAttribute("showHint") != "false") {
						$pageContents.data("attempts", $pageContents.data("attempts")+1);
						if ($pageContents.data("attempts") >= (x_currentPageXML.getAttribute("attemptsBeforeHint") != undefined && $.isNumeric(x_currentPageXML.getAttribute("attemptsBeforeHint")) ? Number(x_currentPageXML.getAttribute("attemptsBeforeHint")) : 2)) {
							$("#showBtn").show();
						}
					}
					
				} else {
					// if tracked then you don't get to try again (is this how it should be?)
					$incorrectTargets.addClass("incorrect");
					$("#submitBtn").hide();
				}
				
				// feedback...
				if (score == $("#targetHolder .target").length) {
					$("#labelHolder").hide();
					$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("feedback")));
				} else {
					if (score == 0) {
						$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillWrongTracking") != undefined && x_currentPageXML.getAttribute("gapFillWrongTracking") != "" ? x_currentPageXML.getAttribute("gapFillWrongTracking") : "You have not filled any gaps correctly."));
					} else {
						$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillPartWrongTracking") != undefined && x_currentPageXML.getAttribute("gapFillPartWrongTracking") != "" ? x_currentPageXML.getAttribute("gapFillPartWrongTracking") : "Your correct answers are shown in green."));
					}
				}
				$feedbackTxt.fadeIn();
				
				//TODO: input veranderen.
                var l_options = [];
                var l_answers = [];
				for (var interactionNumber = 0; interactionNumber < answerData.length; interactionNumber++) {
					var correctAnswer = answerData[interactionNumber][0];

					var labelSource = labelAnswers[correctAnswer];
					var option = {source: labelSource, target: correctAnswer};
					l_options.push(option);
					if (option.source == option.target) {
						correct_answers++;
					}

					var l_answer = labelSource + "-->" + correctAnswer;
					l_answers.push(l_answer);
					var feedback = "Correct";
					if (!correct)
						feedback = "Incorrect";
					total++;
				}
				var correct = (total == correct_answers);
                var result = {
                    success: correct,
                    score: (correct ? 100.0 : 0.0)
                };

                XTExitInteraction(x_currentPage, 0, result, l_options, l_answers, feedback);


            } else {
				// if tracking is on then you must fully complete before checking answers
				$("#feedbackTxt #txt").html(x_addLineBreaks(x_currentPageXML.getAttribute("gapFillIncomplete") != undefined && x_currentPageXML.getAttribute("gapFillIncomplete") != "" ? x_currentPageXML.getAttribute("gapFillIncomplete") : "Please complete the exercise."));
				$feedbackTxt.fadeIn();
				completeItPlease = true;
			}
			
			gapFill.finishTracking();
			if(this.isTracked && !completeItPlease){
				this.hasBeenTracked = true;
			}
		}
		//Starting the tracking
		this.initTracking = function() {
			// Track the gapfill page
			this.weighting = 1.0;
            if (x_currentPageXML.getAttribute("trackingWeight") != undefined)
            {
				this.weighting = x_currentPageXML.getAttribute("trackingWeight");
			}
			if (x_currentPageXML.getAttribute("interactivity") == "Drop Down Menu")
			{
                XTSetPageType(x_currentPage, 'numeric', answerData.length, this.weighting);
			}
			else {
                XTSetPageType(x_currentPage, 'numeric', 1, this.weighting);
            }
		}
		
		//Stopping the tracking
		this.finishTracking = function() {
			if(total != 0)
			{
				XTSetPageScore(x_currentPage, ((correct_answers * 100.0)/total), x_currentPageXML.getAttribute("trackinglabel"));
			}
			else
			{
				XTSetPageScore(x_currentPage, 0.0, x_currentPageXML.getAttribute("trackinglabel"));
			}

		}
		
		
	}
	
	gapFill.init();
	
</script>


<div id="pageContents">
	
	<div class="splitScreen">
		
		<div id="textHolder" class="left">
			<div id="mainText" tabindex="1"></div>
		</div>
		
		<div id="dragDropHolder" class="right">
			<div id="mainPanel" class="panel">
				<div id="targetHolder"></div>
				<div id="labelHolder"></div>
				<button id="submitBtn"></button>
				<button id="showBtn"></button>
				<div id="feedbackTxt">
					<div id="txt"></div>
					<div id="audioHolder"></div>
				</div>
			</div>
		</div>
		
	</div>
	
</div>

*/});