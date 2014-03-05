var packageInfo = {};
var biocVersion;

var displayPackages = function(packageList, nodeName) {
    if (packageList == null) {
        jQuery("#packages").empty();
        return;
    }
    jQuery(".jstree li:not([id])").hide(); // hide childless views

    var html = "<h3>Packages found under " + nodeName + ":</h3>\n";
    var parents = findParents(nodeName);

    var category = parents[0];

    var map = {"Software": "bioc", "AnnotationData": "data/annotation", "ExperimentData": "data/experiment"};

    html += "<table><tr><th>Package</th><th>Maintainer</th><th>Title</th></tr>\n";
    
    
    var tableData = "";
    for (var i = 0; i < packageList.length; i++) {
        var rowClass = (i % 2 == 0) ? "row_odd" : "row_even";
        var pkg = packageList[i];
        var url = getHostUrl() + "/" + map[category] + "/html/" + pkg + ".html"
        tableData += '<tr class="'+rowClass+'" id="pkg_' + pkg + '">\n';
        tableData += '\t<td><a href="'+url+'">'+pkg+'</a></td>\n';
        var cleanMaintainer = packageInfo[pkg]["Maintainer"].replace(/ *<[^>]*>/g, "");
        tableData += '\t<td>'+cleanMaintainer+'</td>\n';
        tableData += '\t<td>'+packageInfo[pkg]["Title"]+'</td>\n';
        tableData += "</tr>\n";
    }
    html += tableData;
    
    html += "</table>\n";
    
    jQuery("#packages").html(html);
    
}


var jumpToAnchor = function() {
    var tmp = ("" + window.location).split("#");
    document.getElementById('treeTop').scrollIntoView(true);
}

var nodeSelected = function(event, data){
    var nodeName;
    // for IE
    nodeName = data['args'][0]['innerText'];
    
    if (data['args'][0]['text'] != undefined) {
        nodeName = data['args'][0]['text'];
    }
    
    
    
    if (nodeName == undefined) {
        nodeName = getNodeName();
    } 


    nodeName = nodeName.trim();

    var bareNodeName = nodeName.split(" ")[0];
    var wl = ("" + window.location.href).split("?")[0];
    wl = wl.split("#")[0];

    var newUrl = "" + wl + "#" + "___" + bareNodeName;
    window.location.href = newUrl;
    
    var tmp = nodeName.split(" ");
    nodeName = tmp[0];
    var packageList = getAllPackages(nodeName);
    if (packageList.length > 0) {
        displayPackages(packageList, nodeName);
    } else {
        displayPackages(null, nodeName);
    }
      //jumpToAnchor();
}


var setBiocVersion = function() {
    
    var href = window.location.href;


    if (href.match(new RegExp("/" + releaseVersion + "/"))) {
        biocVersion = releaseVersion;
    } else if (href.match(new RegExp("/" + develVersion + "/"))) {
        biocVersion = develVersion;
    } else if (href.toLowerCase().match(new RegExp("/release/"))) {
        biocVersion = releaseVersion;
    } else if (href.toLowerCase().match(new RegExp("/devel/"))) {
        biocVersion = develVersion;
    } else if (href.match(/\/packages\/([^/]*)\//)) {
        biocVersion = RegExp.$1;
    }
    
    
    
    var versionText;
    
    if (biocVersion == releaseVersion) {
        versionText = "Release"
    } else if (biocVersion == develVersion) {
        versionText = "Development";
    } else {
      versionText ="";
    }
    
    var versionString = biocVersion;
    if (versionText != "") {
        versionString += " (" + versionText + ")";
    }
    
    
    jQuery("#bioc_version").html(versionString);
}


var findParents = function (nodeId) {
    var parents = jQuery("#" + nodeId).parentsUntil("#tree");
    var ret = [];
    ret.push(nodeId);
    jQuery.each(parents, function(index, value){
        var id = jQuery(value).attr("id");
        if (id.length > 0) {
            ret.push(id);
        }
    });
    ret.reverse();
    return ret;
}

var getNodeName = function() {
    var wlh = window.location.href;
    var segs = [];
    segs = wlh.split("#");
    if (segs.length == 2) {
        return segs[1].replace("___", "");
    } else {
        return "";
    }
}

var init = function() {
    // todo add ajax failure method (possible?)
    
    var initiallySelected = [];
    var nodeName = "";
    nodeName = getNodeName();
    
    if (nodeName != "") {
        initiallySelected.push(nodeName);
    }
    
    jQuery("#tree").jstree({ 
        "core": {
            "animation": 0
        },
        "ui": {
          "initially_select": initiallySelected
        },
            "themes": {
                "theme": "apple",
                "dots": false,
                "icons": false
            },
            "json_data": dataTree,
            "plugins" : [ "themes", "json_data", "ui" ]
        });


        // explicitly add biocViewsTree class because the widget strips it off
        jQuery("#tree").addClass("biocViewsTree");


    /*
    jQuery("#tree").bind("close_node.jstree dblclick.jstree delete_node.jstree deselect_node.jstree destroy.jstree drag_start.vakata drag_stop.vakata get_rollback.jstree init.jstree load_node.jstree loaded.jstree mousedown.jstree move_node.jstree open_node.jstree rename_node.jstree reopen.jstree select_node.jstree set_rollback.jstree ", function (event, data) {
        log("event name: " + event.type);
    })
    */
    
    jQuery("#tree").bind("select_node.jstree", function(event, data){
        nodeSelected(event, data);
    });
    
    jQuery("#tree").bind("loaded.jstree", function(event, data){
        var initiallyOpen = [];
        var openNode = getNodeName();

        if (openNode != "") {
            initiallyOpen = findParents(openNode);
            for(var i = 0; i < initiallyOpen.length; i++) {
                jQuery("#tree").jstree("open_node", "#" + initiallyOpen[i]);
            }
        }
    });


    jQuery("#tree-toggler").click(function(){
        jQuery(".jstree li:not([id])").toggle();
    });


    
    
}



var getHostUrl = function() {
    var url = window.location.href;
    var segs = url.split("/");
    segs.pop();
    url = segs.join("/");
    return(url);
}

var addToPackageInfo = function(data) {
    var ret = {};
    var content = data['content'];
    for (var i = 0; i < content.length; i++) {
        var pkg = content[i][0];
        var maintainer = content[i][1];
        var title = content[i][2];
        ret[pkg] = {"Maintainer": maintainer, "Title": title};
    }
    return(ret);
}


var loadPackageData = function() {
    if (typeof bioc_packages != "undefined")
        jQuery.extend(packageInfo, addToPackageInfo(bioc_packages));
    if (typeof data_annotation_packages != "undefined")
        jQuery.extend(packageInfo, addToPackageInfo(data_annotation_packages));
    if (typeof data_experiment_packages != "undefined")
        jQuery.extend(packageInfo, addToPackageInfo(data_experiment_packages));
}


//document ready function
jQuery(function () {
    setBiocVersion();
    if (biocVersion == releaseVersion) {
        jQuery("#tree-toggler-div").hide();
    }

    //do this in displayPackages instead:
    //jQuery(".jstree li:not([id])").hide(); 

    loadPackageData();
    init();
    start();


});



var G = new jsnx.DiGraph();

var visitNode = function(data, f) {
    //debugger;
    if ('data' in data) {
        var tag = data['data'];
        var biocView = tag.split(" ")[0];
        //G.add_node(biocView);
        f(data);
        //console.log(biocView);
        /*
        if (biocView == query) {
            alert("helo!");
            return(data);

        }
        */
        for (var i = 0; i < data['children'].length; i++) {
            var child = data['children'][i];
            var res = visitNode(child, f);
            //if (res != "") return(res);
        }
    } else {
        return "";
    }
}

var traverseTree = function(f) {
    var views = [];
    var query = "AssayDomains";
    for (var i =0; i < dataTree['data'].length; i++) {
        obj = dataTree['data'][i];
        var res = visitNode(obj, f);
    }
}

var eff = function(data) {
    if ('data' in data) {
        var tag = data['data'];
        var biocView = tag.split(" ")[0];
        G.add_node(biocView);
    }
}


var eff2 = function(data) {
    var biocView;
    if ('data' in data) {
        var tag = data['data'];
        var biocView = tag.split(" ")[0];
    } else {
        console.log("this is unexpected!");
    }
    if ('attr' in data) {
        var attr = data['attr'];
        if ('packageList' in attr) {
            var packageList = attr['packageList'];
            var pkgs = packageList.split(",");
            G.node.get(biocView).pkgs = pkgs;
        }
    }
    if ('children' in data) {
        for (var i =0; i < data['children'].length; i++) {
            var child = data['children'][i];
            if(('attr' in child) && ('id' in child['attr']))
                G.add_edge(biocView, child['attr']['id']);
        }
    }
}

var bla;
var nodes;
var nodeIdx = {};

var getNode = function(name, full) {
    var res = nodes[nodeIdx[name]];
    if (full)
        return(res)
    return(res[0]);
}

var start = function()
{
    traverseTree(eff);
    traverseTree(eff2);

    nodes = G.nodes(true);

    for (var i =0; i < nodes.length; i++) {

        var node = nodes[i];
        var name = node[0];
        nodeIdx[name] = i;

    }

}

var rf = function(node) {
    var successorList = G.successors(node);
    var l = successorList.length;
    for (var i = 0; i < l; i++) {
        successorList = successorList.concat(rf(getNode(successorList[i])));
    }
    return(successorList);
}

var getAllSuccessors = function(startName) {
    var startNode = getNode(startName);
    return(rf(startNode));
}

getAllPackages = function(startPkg) {
    var succ = getAllSuccessors(startPkg);
    var node = getNode(startPkg, true)[1];
    var res = {};
    if ('pkgs' in node && node['pkgs'].length > 0) {
        for (var i = 0; i < node['pkgs'].length; i++) {
            res[node['pkgs'][i]] = 1;
        }
    }
    for (var i = 0; i < succ.length; i++) {
        var item = succ[i];
        var node = getNode(item, true);
        var obj = node[1];
        if ('pkgs' in obj) {
            for (var j = 0; j < obj['pkgs'].length; j++) {
                var pkg = obj['pkgs'][j];
                res[pkg] = 1;
            }
        }
    }
    var keys = Object.keys(res);
    //console.log("got " + keys.length + " packages for " + startPkg);
    return(keys.sort(
        function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
        }
    ));

}
