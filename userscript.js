// ==UserScript==
// @name         BAJ Alchemists
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  Improve BAJ Alchemists
// @author       Doug
// @updateURL    https://raw.githubusercontent.com/dbeleznay/baj-alchemists/master/userscript.js
// @downloadURL  https://raw.githubusercontent.com/dbeleznay/baj-alchemists/master/userscript.js
// @match        http://www.boiteajeux.net/jeux/alc/*
// @grant        GM_setValue
// @grant        GM_getValue
// @require https://userscripts-mirror.org/scripts/source/107941.user.js

// ==/UserScript==
/* jshint -W097 */
(function() {
    'use strict';

    if (typeof afficherGrid !== 'undefined') {
        var colourTable = [];
        var gameID = document.URL.match(/[\?\&]id=([^\&\#]+)/i) [1];
        var layerVisibility = [1,0,0,0];
        var numberOfLayers = 4;
        var maxVisibleLayer = 0;
        var layers = [];
        var selectedLayer = 0;

        var oldDoClearGrid = doClearGrid;
        doClearGrid = function() {
            oldDoClearGrid();
            clearColourTable();
            clearRecordSheetLayers();
        };

        var clearColourTable = function() {
            for (var layerN = 0; layerN < numberOfLayers; layerN++) {
                for (var col=0; col<8; col++) {
                    colourTable[layerN][col]=[0,0,0];
                }
            }
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
            redrawColourTable();
        };

        var redrawColourTable = function() {
            for (var col=0; col<8; col++) {
                for (var row=0; row<3; row++) {
                    var text = "";
                    var res = 0;
                    for (var layerN = maxVisibleLayer; layerN >= 0; layerN--) {
                        if(layerVisibility[layerN] && colourTable[layerN][col][row]) {
                            res = colourTable[layerN][col][row]
                            text = colourTableText(res);
                            break;
                        }
                    }
                    $("#colour_mark_"+col+"_"+row).text(text);
                    $("#colour_mark_"+col+"_"+row)[0].res = res;
                }
            }
        }

        var clickColourTable = function(col,row) {
            var res = $("#colour_mark_"+col+"_"+row)[0].res;
            res = (res + 1) % 6;
            colourTable[selectedLayer][col][row] = res;
            $("#colour_mark_"+col+"_"+row)[0].res = res;
            $("#colour_mark_"+col+"_"+row).text(colourTableText(res));
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
        };

        var clickColourCallback = function(col, row, res) {
            $("#colour_popup").hide();
            colourTable[col][row] = res;
            $("#colour_mark_"+col+"_"+row).text(colourTableText(res));
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
        };

        var clickColourTable2 = function(cell) {
            var col = cell.idI;
            var row = cell.idA;
            var rect = $(cell)[0].getBoundingClientRect();
            $(cell).append("<div class='colourPopup' id='colour_popup' style='left: "+rect.right+"px; top: "+rect.bottom+"px;'></div>");
            $("#colour_popup")[0].col = col;
            $("#colour_popup")[0].row = row;

            for (var i=0; i<6; i++) {
                $("#colour_popup").append("<div class='colourPopupButton' id='colour_popup_button_"+ i + "' >"+colourTableText(i)+"</div>");
                $("#colour_popup_button_"+i)[0].res = i;
                $("#colour_popup_button_"+i).click(function() {
                    clickColourCallback(cell.parent.col,cell.parent.row,cell.res);
                });
            }
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
                case 5:
                    ret = "0";
                    break;
            }
            return ret;
        }

        var migrateColourTable = function() {
            var oldColourTable = colourTable;
            colourTable = [];
            // migrate old data first
            var layerN = 0;
            colourTable[layerN] = [];
            for (var i=0; i<8; i++) {
                colourTable[layerN][i]=oldColourTable[i];
            }
            for (layerN = 1; layerN < numberOfLayers; layerN++) {
                colourTable[layerN] = [];
                for (i=0; i<8; i++) {
                    colourTable[layerN][i]=[0,0,0];
                }
            }

            GM_SuperValue.set ("colourTable"+gameID, colourTable);
        };

        var initColourTable = function() {
            for (var layerN = 0; layerN < numberOfLayers; layerN++) {
                colourTable[layerN] = [];
                for (var i=0; i<8; i++) {
                    colourTable[layerN][i]=[0,0,0];
                }
            }
            colourTable = GM_SuperValue.get ("colourTable"+gameID, colourTable);
            if (typeof colourTable[0][0][0] === 'undefined') {  // this is the old save format
                migrateColourTable();
            }

            $("#record_sheet").after("<div id='colour_table' style='position:absolute;top:1475px;left:302px;width:520px;height:120px;'></div>");

            for (var col=0; col<8; col++) {
                var xOff = -2+col*65;
                for (var row=0; row<3; row++) {
                    var yOff = -2 + row*35.5;
                    $("#colour_table").append("<div class='clColourMarker clPointer clSelect' id='colour_mark_"+col+"_"+row+"' style=\"left: "+xOff+"px; top: "+yOff+"px;\"></div>");
                    $("#colour_mark_"+col+"_"+row)[0].idI = col;
                    $("#colour_mark_"+col+"_"+row)[0].idA = row;
                    $("#colour_mark_"+col+"_"+row).click(function() {
                        clickColourTable(this.idI, this.idA);
                        //clickColourTable2(this);
                    });
                }
            }

            $("#knowledge").css('top', '1595px');
            $("#clear_grid").css('top', '1605px');
            redrawColourTable();

        };
        

        var initLayers = function() {
            for (var layerN = 0; layerN < numberOfLayers; layerN++) {
                layers[layerN] = [];
                for (var i=0; i<8; i++) {
                    layers[layerN][i]=[0,0,0,0,0,0,0,0];
                }
            }
            layers = GM_SuperValue.get ("layers"+gameID, layers);
        };

        var clearRecordSheetLayers = function() {
            for (var layerN = 0; layerN < numberOfLayers; layerN++) {
                layers[layerN] = [];
                for (var i=0; i<8; i++) {
                    layers[layerN][i]=[0,0,0,0,0,0,0,0];
                }
            }
            GM_SuperValue.set ("layers"+gameID, layers);
            afficherGrid();
        }

        var clickLayerSelector = function(row) {
            if (row !== selectedLayer) {
                $("#layer_rect_"+selectedLayer).removeClass("l_selected");
                $("#layer_rect_"+row).addClass("l_selected");
                selectedLayer = row;
            }
        }

        var calcMaxVisibleLayer = function (row) {
            for (var i = row; i >=0; i--) {
                if (layerVisibility[i]) {
                    maxVisibleLayer = i;
                    break;
                }
            }
        }

        var clickLayerVisible = function (row, visible) {
            if (row > 0 && row < numberOfLayers) {
                layerVisibility[row] = visible;
                if(visible) {
                    if (row > maxVisibleLayer) {
                        maxVisibleLayer = row;
                    }
                } else {
                    if (row == maxVisibleLayer) {
                        calcMaxVisibleLayer(row);
                    }
                }
            }
            GM_SuperValue.set ("layerVisibility"+gameID, layerVisibility);
            afficherGrid();
            redrawColourTable();
        }

        var clickClearLayer = function (layer) {
            if (layer > 0 && layer < numberOfLayers) {
                for (var i=0; i<8; i++) {
                    layers[layer][i]=[0,0,0,0,0,0,0,0];
                    colourTable[layer][i]=[0,0,0];
                }
            }
            GM_SuperValue.set ("layers"+gameID, layers);
            GM_SuperValue.set ("colourTable"+gameID, colourTable);
            afficherGrid();
            redrawColourTable();
        }


        var initLayerSelector = function() {
            layerVisibility = GM_SuperValue.get ("layerVisibility"+gameID, layerVisibility);
            calcMaxVisibleLayer(numberOfLayers);
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
                    var checked = "";
                    if (layerVisibility[row]) {
                        checked = " checked=true";
                    }
                    $("#layer_rect_"+row).append("<input type='checkbox' id='layer_visible_"+row+"'"+checked+">");
                    $("#layer_visible_"+row)[0].idA = row;
                    $("#layer_visible_"+row).click(function() {
                        clickLayerVisible(this.idA, this.checked);
                    });
                    $("#layer_rect_"+row).append("<div id='layer_clear_"+row+"'>clear</div>");
                    $("#layer_clear_"+row)[0].idA = row;
                    $("#layer_clear_"+row).click(function() {
                    clickClearLayer(this.idA);
                    });
                }
            }
            $("#layer_rect_0").addClass("l_selected");
        };

        initLayers();
        initColourTable();
        initLayerSelector();

        var decorateGrid = function() {
            for(var li=0;li<8;li++) {
                for(var lj=0;lj<8;lj++) {
                    var isSelected = false;
                    var bgimg = $("#recordsheet_mark_"+li+"_"+lj).css('background-image');
                    if (bgimg == "url(\"http://www.boiteajeux.net/jeux/alc/img/cross.png\")") {
                        isSelected = true;
                    } else {
                        for (var ln=1;ln<numberOfLayers;ln++) {
                            if(layerVisibility[ln] && layers[ln][li][lj]) {
                                isSelected = true;
                                break;
                            }
                        }
                    }
                    if (isSelected) {
                        $("#recordsheet_mark_"+li+"_"+lj).css('background-color', 'rgba(0,0,0,0.7)');
                    } else {
                        $("#recordsheet_mark_"+li+"_"+lj).css('background-color', 'transparent');
                    }
                }
            }
        };

        var oldAfficher = afficherGrid;
        afficherGrid = function() {
            oldAfficher();
            decorateGrid();
        };

        var oldDoManualGrid = doManualGrid;
        doManualGrid = function(pIng, pAlc, pVal) {
            if (selectedLayer === 0) {
                oldDoManualGrid(pIng, pAlc, pVal);
            } else {
                var checked = !layers[selectedLayer][pIng][pAlc];
                layers[selectedLayer][pIng][pAlc] = checked;
                GM_SuperValue.set ("layers"+gameID, layers);
                if (checked) {
                    // $("#recordsheet_mark_"+pIng+"_"+pAlc).css("background-image","url(img/cross.png)");
                    $("#recordsheet_mark_"+pIng+"_"+pAlc).css('background-color', 'rgba(0,0,0,0.7)');
                } else {
                    $("#recordsheet_mark_"+pIng+"_"+pAlc).css('background-color', 'transparent');
                }
            }
        };

        var initRules = function() {
            var createRow = function(colour1, colour2) {
                return "<tr><td>"+colour1+"</td><td>-></td><td>"+colour2+"</td></tr>";
            };
            var mapColour = function(id) {
                var ret = "";
                switch (id) {
                    case 'r':
                        ret = "<font color='red'>Red</font>";
                        break;
                    case 'g':
                        ret = "<font color='green'>Green</font>";
                        break;
                    case 'b':
                        ret = "<font color='blue'>Blue</font>";
                        break;
                }
                return ret;
            };
            $("#layer_selector").after("<div id='deduction_rules' style='position:absolute;top:1475px;left:202px;width:520px;height:120px;'></div>");
            $("#deduction_rules").append("<table>"+createRow("create","differ in")+createRow(mapColour('r'),mapColour('g'))+createRow(mapColour('g'),mapColour('b'))+createRow(mapColour('b'),mapColour('r'))+"</table>");
        };
        initRules();


    } else {
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
                $("#histo_selector").append("<label style='display: inline'><input type='checkbox' id='player_visible_"+player+"' checked=true style='display: inline'>"+history[player][0]+"</label>");
                $("#player_visible_"+player)[0].idA = player;
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
    }
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
    addGlobalStyle('.colourPopupButton {background-color: #3498DB;color: white; padding: 16px; font-size: 16px; border: none; cursor: pointer;}');
    addGlobalStyle('.colourPopupButton:hover, .dropbtn:focus { background-color: #2980B9;}');
    addGlobalStyle('.colourPopup { position: relative;display: inline-block;}');


})();