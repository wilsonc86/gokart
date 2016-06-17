"use strict";
window.gokart = (function(self) {
    $(document).foundation();
    svg4everybody();

    var $self = $(self)
    var ui = self.ui = {};

    ui.sizes = {
        "tool-size-small": 16,
        "tool-size-medium": 32,
        "tool-size-large": 64
    };

    ui.colours = {
        "tool-colour-r": "#cc0000",
        "tool-colour-o": "#f57900",
        "tool-colour-y": "#edd400",
        "tool-colour-g": "#73d216",
        "tool-colour-b": "#3465a4",
        "tool-colour-v": "#75507b",
        "tool-colour-br": "#8f5902",
        "tool-colour-gr": "#555753",
        "tool-colour-bl": "#000000"
    };

    // bind menu side-tabs to reveal the side pane
    var offCanvasLeft = $("#offCanvasLeft")
    $("#menu-tabs").on("change.zf.tabs", function(ev) {
        offCanvasLeft.addClass("reveal-for-medium");
        self.map.updateSize();
    }).on("click", ".tabs-title a[aria-selected=false]", function(ev) {
        offCanvasLeft.addClass("reveal-for-medium");
        $(this).attr("aria-selected", true);
        self.map.updateSize();
    }).on("click", ".tabs-title a[aria-selected=true]", function(ev) {
        offCanvasLeft.removeClass("reveal-for-medium");
        $(this).attr("aria-selected", false);
        self.map.updateSize();
    });

    // rig up groups
    $("#tool-group-mode").on("click", ".button", function(ev) {
        $("#tool-group-mode .button").removeClass("selected");
        $(this).addClass("selected");
        self.mode = this.id;
    });

    $("#tool-group-size").on("click", ".button", function(ev) {
        $("#tool-group-size .button").removeClass("selected");
        $(this).addClass("selected");
        self.size = this.id;
    });

    $("#tool-group-colour").on("click", ".button", function(ev) {
        $("#tool-group-colour .button").removeClass("selected");
        $(this).addClass("selected");
        self.colour = this.id;
    });

    // hover information
    self.infoDiv = $("#info")
    self.displayFeatureInfo = debounce(function(pixel) {
        var features = {}
        var featureFound = self.map.forEachFeatureAtPixel(pixel, function(f) {
            features[f.getGeometry().getExtent().join(" ")] = f.get("to_html")(f.getProperties());
        });
        if (Object.values(features).length > 0) {
            self.infoDiv.find(".content").html(Object.values(features).join(""));
            self.infoDiv.find(".title").html("<h5>" + Object.values(features).length + " feature(s): <small>" + ol.coordinate.toStringXY(self.map.getCoordinateFromPixel(pixel), 3) + "</small></h5>")
            var offset = 20;
            var topPx = pixel[1] - self.infoDiv.outerHeight() - offset;
            if (topPx < 0) { topPx = 0 };
            var leftPx = pixel[0] + offset;
            if (leftPx + self.infoDiv.outerWidth() > $("#map").width()) { 
                leftPx = $("#map").width() - self.infoDiv.outerWidth(); 
            }
            self.infoDiv.css({left: leftPx + "px", top: topPx + "px"});
            self.infoDiv.show();
        }
    }, 10);

    // update "Map Layers" pane
    ui.renderActiveLayers = debounce(function(ev) {
        if (ui.updatingOrder) { return }
        ui.layersActive.html(ui.activeLayersTmpl({
            layers: self.map.getLayers().getArray()
        })).append(ui.layersActive.children().get().reverse());
        ui.renderCatalogueLayers();
    }, 250);
    
    // update "Layer Catalogue" pane
    ui.renderCatalogueLayers = function(ev) {
        if (ui.updatingCatalogue) { return }
        $("#layers-catalogue-list").html(ui.catalogueLayersTmpl({
            layers: self.catalogue
        }));
    }

    // change order of OL layers based on "Map Layers" list order
    ui.updateOrder = function(el) {
        ui.updatingOrder = true;
        $(ui.layersActive.children().get().reverse()).each(function() {
            var layer = self.layerById($(this).attr("data-id"));
            self.map.removeLayer(layer);
            self.map.addLayer(layer);
        })
        ui.updatingOrder = false;
    }

    ui.swapBaseLayers = true;

    ui.initCatalogue = function(element) {
        ui.catalogueLayersTmpl = Handlebars.compile($(element + "-template").html());
        $(element).on("change", "div[data-id] input[data-action='toggle']", function() {
            ui.updatingCatalogue = true;
            var layer = self.catalogue[$(this).parents("div[data-id]").attr("data-id")];
            // TODO: baselayer logic
            if ($(this).prop('checked')) {
                if (layer.base) {
                    if (ui.swapBaseLayers) {
                        self.map.getLayers().forEach(function(layer) {
                            if (layer.get("catalogueEntry").base) {
                                self.map.removeLayer(layer);
                                layer.get("catalogueEntry").olLayer = undefined;
                            }
                        });
                    }
                    ui.updatingCatalogue = false;
                    self.map.getLayers().insertAt(0, layer.init());
                } else {
                    self.map.addLayer(layer.init());
                }
            } else {
                var olLayer = layer.olLayer;
                layer.olLayer = undefined;
                self.map.removeLayer(olLayer);
            }
            ui.updatingCatalogue = false;
        });
    }

    ui.initActiveLayers = function(element) {
        ui.activeLayersTmpl = Handlebars.compile($(element + "-template").html());
        ui.layerDetailsTmpl = Handlebars.compile($("#layer-details-template").html());
        ui.layersActive = $(element).on("click", "div[data-id]", function() {
            $("#layer-details").html(ui.layerDetailsTmpl({
                ol_layer: self.layerById($(this).attr("data-id")),
                catalogue_layer: {abstract: "placeholder abstract"}
            }));
        }).on("click", "div[data-id] a[data-action='remove']", function() {
            var layer = self.layerById($(this).parents("div[data-id]").attr("data-id"));
            layer.get("catalogueEntry").olLayer = undefined;
            self.map.removeLayer(layer);
        })
    }

    $self.on("init_map", function() {
        // setup scale events
        ui.menuScale = $("#menu-scale").on("change", function() { self.set_scale($(this).val().replace("1:", "").replace(/,/g, "").replace("K", "")) });
        $.each(self.fixed_scales, function(index, val) { ui.menuScale.append("<option>1:" + val.toLocaleString() + "K</option>") });
        ui.menuScale.prepend('<option id="actualScale">' + self.getScaleString() + '</option>');
        self.map.on("postrender", function() {
            ui.menuScale.find("#actualScale").text(self.getScaleString());
            ui.menuScale.val(self.getScaleString());
        });
        $("#download-jpg").on("click", function() { self.print("jpg") });
        $("#download-pdf").on("click", function() { self.print("pdf") });
        // setup layer ordering if layer ui available
        if ($("#layers-active").length == 1) {
            ui.initActiveLayers("#layers-active");
            ui.initCatalogue("#layers-catalogue");
            ui.renderActiveLayers();
            self.map.getLayerGroup().on("change", ui.renderActiveLayers);
            dragula([ui.layersActive.get(0)]).on("dragend", ui.updateOrder);
        }
    });

    return self;
})(window.gokart || {});


