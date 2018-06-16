// ==UserScript==
// @name         BAJ Alchemists
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Improve BAJ Alchemists
// @author       Doug
// @match        http://www.boiteajeux.net/jeux/alc/*
// @grant        GM_setValue
// @grant        GM_getValue
// @require https://userscripts-mirror.org/scripts/source/107941.user.js

// ==/UserScript==
/* jshint -W097 */
(function() {
    'use strict';

//    if (typeof afficherGrid === undefined) {
        var decorateGrid = function() {
            var images = document.getElementsByClassName("clRecordSheetMarker");
            for (var i = 0; i < images.length; i++) {
                var bgimg = $(images[i]).css('background-image');

                if (bgimg == "url(\"http://www.boiteajeux.net/jeux/alc/img/cross.png\")") {
                    $(images[i]).css('background-color', 'rgba(0,0,0,0.7)');
                } else {
                    $(images[i]).css('background-color', 'transparent');
                }
            };

        };

        var oldAfficher = afficherGrid;
        afficherGrid = function() {
            oldAfficher();
            decorateGrid();
        };

        var clearColourTable = function() {
            for (var col=0; col<8; col++) {
                colourTable[col]=[0,0,0];
                for (var row=0; row<3; row++) {
                    $("#colour_mark_"+col+"_"+row).text("");
                }
            }
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
        };

        var oldDoClearGrid = doClearGrid;
        doClearGrid = function() {
            oldDoClearGrid();
            clearColourTable();
        };

        var colourTable = [];
        var gameID = document.URL.match(/[\?\&]id=([^\&\#]+)/i) [1];

        var clickColourTable = function(col,row) {
            var res = (colourTable[col][row] + 1) % 5;
            colourTable[col][row] = res;
            $("#colour_mark_"+col+"_"+row).text(colourTableText(res));
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
        };

        var colourTableText = function(id) {
            var ret = "";
            switch (id) {
                case 0:
                    ret = "";
                    break;
                case 1:
                    ret = "+";
                    break;
                case 2:
                    ret = "-";
                    break;
                case 3:
                    ret = "+/-";
                    break;
                case 4:
                    ret = "-/+";
                    break;
            }
            return ret;
        }

        var initColourTable = function() {
            for (var i=0; i<8; i++) {
                colourTable[i]=[0,0,0];
            }
            colourTable = GM_SuperValue.get ("colourTable"+gameID, colourTable);

            $("#record_sheet").after("<div id='colour_table' style='position:absolute;top:1475px;left:302px;width:520px;height:120px;'></div>");

            for (var col=0; col<8; col++) {
                var xOff = -2+col*65;
                for (var row=0; row<3; row++) {
                    var yOff = -2 + row*35.5;
                    var ctText = colourTableText(colourTable[col][row]);
                    $("#colour_table").append("<div class='clColourMarker clPointer clSelect' id='colour_mark_"+col+"_"+row+"' style=\"left: "+xOff+"px; top: "+yOff+"px;\">"+ctText+"</div>");
                    $("#colour_mark_"+col+"_"+row)[0].idI = col;
                    $("#colour_mark_"+col+"_"+row)[0].idA = row;
                    $("#colour_mark_"+col+"_"+row).click(function() {
                        clickColourTable(this.idI,this.idA);
                    });
                }
            }

            $("#knowledge").css('top', '1595px');
            $("#clear_grid").css('top', '1605px');

        };

        initColourTable();

        var selectedLayer = 0;

        var clickLayerSelector = function(row) {
            if (row !== selectedLayer) {
                $("#layer_rect_"+selectedLayer).removeClass("l_selected");
                $("#layer_rect_"+row).addClass("l_selected");
                selectedLayer = row;
            }
        }

        var layerVisibility = [1,1,1,1];
        var numberOfLayers = 4;

        var clickLayerVisible = function (row, visible) {
            if (row > 0 && row < numberOfLayers) {
                layerVisibility[row] = visible;
            }
        }

        var initLayerSelector = function() {
            $("#record_sheet").after("<div id='layer_selector' style='position:absolute;top:1157px;left:215px;width:70px;height:120px;'></div>");
            var layers = ["base", 1, 2, 3];
            for(var row=0; row < 4; row++) {
                var yOff = -2 + row*35.5;
                $("#layer_selector").append("<div class='clLayer clPointer clSelect' id='layer_rect_"+row+"' style=\"left: 152px; top: "+yOff+"px;\"></div>");
                $("#layer_rect_"+row).append("<div class='clLayerLabel' id='layer_label_"+row+"'>"+layers[row]+"</div>");
                $("#layer_rect_"+row)[0].idA = row;
                $("#layer_rect_"+row).click(function() {
                    clickLayerSelector(this.idA);
                });
                if (row > 0) {
                    $("#layer_rect_"+row).append("<input type='checkbox' id='layer_visible_"+row+"' checked="+layerVisibility[row]+">");
                    $("#layer_visible_"+row)[0].idA = row;
                    $("#layer_visible_"+row).click(function() {
                        clickLayerVisible(this.idA, this.checked);
                    });
                }
            }
            $("#layer_rect_0").addClass("l_selected");
        };

        initLayerSelector();
//    } else {
        var history = {};

        var gatherHistory = function() {
            $("tr", "table.clHisto").each(function() {
                var td = $(this).children().first()[0].innerHTML;
                var playerHTML = td.match(/<br>(.*)/);
                if(playerHTML) {
                    playerHTML = playerHTML[1];
                    var name = td.match(/<br>(.*)&nbsp;/)[1];
                    if (!(name in history)) {
                        history[name] = [playerHTML,[]];
                    }
                    history[name][1].push(this);
                }
                });
        }
        gatherHistory();

        var initHistorySelector = function() {
            $(".clHisto").before("<div id='histo_selector'></div>");
            for (var player in history) {
                $("#histo_selector").append("<input type='checkbox' id='player_visible_'"+player+" checked=true>");
           //     $("#player_visible_"+player)[0].idA = player;
                $("#player_visible_"+player).click(function() {
                    if (this.checked) {
                        for (var row = 0; row < history[this.idA][1].length; row++) {
                            $(history[this.idA][1][row]).show();
                        }
                    } else {
                        for (row = 0; row < history[this.idA][1].length; row++) {
                            $(history[this.idA][1][row]).hide();
                        }
                    }
                });
            }

        }

        initHistorySelector();
//    }
    var addGlobalStyle = function (css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    addGlobalStyle('#record_sheet .clSelect { border: dashed 3px rgba(98, 196, 98, .5); margin: 2px; }');
    addGlobalStyle('#divModal { position: fixed; top: 40px; left: 270px; margin: 0px;}');
    addGlobalStyle('.clColourMarker {position: absolute; width: 58px; height: 30px; border-radius: 5px;font-size:18px;line-height:26px;}');
    addGlobalStyle('.l_selected {background-color: #f89406}');

})();



