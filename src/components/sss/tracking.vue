<template>
  <div class="tabs-panel" id="menu-tab-tracking">
    <div class="row collapse">
      <div class="columns">
        <ul class="tabs" id="tracking-tabs">
          <li class="tabs-title is-active"><a class="label" aria-selected="true">Resource Tracking</a></li>
        </ul>
      </div>
    </div>
    <div class="row collapse" id="tracking-tab-panels">
      <div class="columns">
        <div class="tabs-content vertical" data-tabs-content="tracking-tabs">
          <div id="tracking-list-tab" class="tabs-panel is-active" v-cloak>
            <div id="tracking-list-controller-container">
            <div class="tool-slice row collapse">
              <div class="small-12">
                <div class="expanded button-group">
                  <a v-for="t in tools | filterIf 'showName' undefined" class="button button-tool" v-bind:class="{'selected': t.name == annotations.tool.name}"
                    @click="annotations.setTool(t)" v-bind:title="t.name">{{{ annotations.icon(t) }}}</a>
                </div>
                <div class="row resetmargin">
                  <div v-for="t in tools | filterIf 'showName' true" class="small-6" v-bind:class="{'rightmargin': $index % 2 === 0}" >
                    <a class="expanded secondary button" v-bind:class="{'selected': t.name == annotations.tool.name}" @click="annotations.setTool(t)"
                      v-bind:title="t.name">{{{ annotations.icon(t) }}} {{ t.name }}</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="switch tiny">
                <input class="switch-input" id="resourcesInViewport" type="checkbox" v-bind:checked="viewportOnly" @change="toggleViewportOnly" />
                <label class="switch-paddle" for="resourcesInViewport">
                  <span class="show-for-sr">Viewport resources only</span>
                </label>
              </div>
              <label for="resourcesInViewport" class="side-label">Restrict to viewport ({{ stats }})</label>
            </div>
            <div class="row">
              <div class="switch tiny">
                <input class="switch-input" id="toggleResourceLabels" type="checkbox" v-bind:checked="resourceLabels" @change="toggleResourceLabels" />
                <label class="switch-paddle" for="toggleResourceLabels">
                  <span class="show-for-sr">Display resource labels</span>
                </label>
              </div>
              <label for="toggleResourceLabels" class="side-label">Display resource labels</label>
            </div>
            <div class="row">
              <div class="switch tiny">
                <input class="switch-input" id="toggleResourceDirections" type="checkbox" v-bind:checked="resourceDirections" @change="toggleResourceDirections" />
                <label class="switch-paddle" for="toggleResourceDirections">
                  <span class="show-for-sr">Display resource directions</span>
                </label>
              </div>
              <label for="toggleResourceDirections" class="side-label">Display resource directions</label>
            </div>
            <div class="row">
              <div class="switch tiny">
                <input class="switch-input" id="toggleResourceInfo" type="checkbox" v-bind:disabled="!setting.hoverInfoSwitchable" v-bind:checked="setting.hoverInfo" @change="setting.toggleHoverInfo" />
                <label class="switch-paddle" for="toggleResourceInfo">
                  <span class="show-for-sr">Display hovering resource info</span>
                </label>
              </div>
              <label for="toggleResourceInfo" class="side-label">Display hovering resource info</label>
            </div>
            <div class="row collapse">
              <div class="small-6 columns">
                <select name="select" v-model="cql" @change="updateCQLFilter">
                  <option value="" selected>All resources</option> 
                  <option value="symbolid LIKE '%aircraft'">Aircraft</option>
                  <option value="symbolid LIKE '%comms_bus'">Communications Bus</option>
                  <option value="symbolid LIKE '%gang_truck'">Gang Truck</option>
                  <option value="symbolid LIKE '%heavy_duty'">Heavy Duty</option>
                  <option value="(symbolid LIKE '%heavy_duty' OR symbolid LIKE '%gang_truck')">Gang Truck and Heavy Duty</option>
                  <option value="symbolid LIKE '%light_unit'">Light Unit</option>
                  <option value="(symbolid LIKE '%dozer' OR symbolid LIKE '%grader' OR symbolid LIKE '%loader')">Machinery</option>
                  <option value="(symbolid LIKE '%2_wheel_drive' OR symbolid LIKE '%4_wheel_drive_passenger' OR symbolid LIKE '%4_wheel_drive_ute')">Other Light Fleet</option>
                </select>
              </div>
              <div class="small-6 columns">
                <input type="search" v-model="search" placeholder="Find a resource" @keyup="updateResourceFilter">
              </div>
            </div>
            <div class="row">
              <div class="small-7">
                <div class="columns">
                  <div class="row">
                    <div class="switch tiny">
                      <input class="switch-input" id="selectedOnly" type="checkbox" v-model="selectedOnly" @change="updateCQLFilter('selectedDevice')" />
                      <label class="switch-paddle" for="selectedOnly">
                    <span class="show-for-sr">Show selected only</span>
                 </label>
                    </div>
                    <label for="selectedOnly" class="side-label">Show selected only</label>
                  </div>
                </div>
                <div class="columns">
                  <div class="row">
                    <div class="switch tiny">
                      <input class="switch-input" id="resourceHistory" type="checkbox" v-model="toggleHistory" @change="clearHistory" />
                      <label class="switch-paddle" for="resourceHistory">
                    <span class="show-for-sr">Query history</span>
                  </label>
                    </div>
                    <label for="resourceHistory" class="side-label">Query history</label>
                  </div>
                </div>
              </div>
              <div class="small-5">
                <a title="Zoom to selected" class="button" @click="zoomToSelected()" ><i class="fa fa-search"></i></a>
                <a title="Download list as geoJSON" class="button" @click="downloadList()" ><i class="fa fa-download"></i></a>
                <a title="Download all or selected as CSV" class="button" href="{{sssService}}/devices.csv?{{downloadSelectedCSV()}}" target="_blank" ><i class="fa fa-table"></i></a>
              </div>
            </div>
            <div id="history-panel" v-if="toggleHistory">
              <div class="row collapse tool-slice">
                <div class="small-2">
                  <label for="historyFrom">From:</label>
                </div>
                <div class="small-4">
                  <input type="text" v-on:blur="verifyDate($event,['YY-M-D','YYYY-M-D'],'YYYY-MM-DD')" v-model="historyFromDate" placeholder="yyyy-mm-dd"></input>
                </div>
                <div class="small-2">
                  <input type="text" v-on:blur="verifyDate($event,'H:m','HH:mm')" v-model="historyFromTime" placeholder="24:00"></input>
                </div>
                <div class="small-4">
                  <select name="select" v-model="history" @change="historyRange = history">
                  <option value="" selected>Date range</option> 
                  <!-- values in milliseconds -->
                  <option value="3600000">Last hour</option> 
                  <option value="10800000">Last 3 hours</option> 
                  <option value="86400000">Last day</option> 
                  <option value="604800000">Last week</option> 
                  <option value="2678400000">Last month</option> 
                </select>
                </div>
              </div>
              <div class="row collapse tool-slice">
                <div class="small-2">
                  <label for="historyTo">To:</label>
                </div>
                <div class="small-4">
                  <input type="text" v-on:blur="verifyDate($event,['YY-M-D','YYYY-M-D'],'YYYY-MM-DD')" v-model="historyToDate" placeholder="yyyy-mm-dd"></input>
                </div>
                <div class="small-2">
                  <input type="text" v-on:blur="verifyDate($event,'H:m','HH:mm')" v-model="historyToTime" placeholder="24:00"></input>
                </div>
                <div class="small-2"></div>
                <div class="small-2">
                  <button v-bind:disabled="queryHistoryDisabled" class="button" style="float: right" @click="historyCQLFilter">Go</button>
                </div>
              </div>
            </div>
            </div>


            <div id="tracking-list" class="layers-flexibleframe scroller" style="margin-left:-15px; margin-right:-15px;">
              <div v-for="f in features" class="row feature-row" v-bind:class="{'feature-selected': selected(f) }"
                @click="toggleSelect(f)" track-by="get('id')">
                <div class="columns">
                  <a v-if="whoami.editVehicle && f.get('source_device_type') != 'tracplus'" @click.stop.prevent="map.editResource($event)" title="Edit resource" href="{{sssService}}/sss_admin/tracking/device/{{ f.get('id') }}/change/" target="_blank" class="button tiny secondary float-right"><i class="fa fa-pencil"></i></a>
                  <div class="feature-title"><img class="feature-icon" id="device-icon-{{f.get('id')}}" v-bind:src="featureIconSrc(f)" /> {{ f.get('label') }} <i><small>({{ ago(f.get('seen')) }})</small></i></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { ol, moment,utils } from 'src/vendor.js'
  export default {
    store: {
        sssService:'sssService',
        resourceLabels:'settings.resourceLabels',
        resourceDirections:'settings.resourceDirections',
        viewportOnly:'settings.viewportOnly',
        screenHeight:'layout.screenHeight',
        leftPanelHeadHeight:'layout.leftPanelHeadHeight',
        activeMenu:'activeMenu',
        whoami:'whoami'
    },
    data: function () {
      var fill = '#ff6600'
      var stroke = '#7c3100'
      return {
        viewportOnly: true,
        toggleHistory: false,
        selectedOnly: false,
        search: '',
        cql: '',
        tools: [],
        history: '',
        fields: ['id', 'registration', 'rin_display', 'deviceid', 'symbol', 'district_display', 'usual_driver', 'callsign_display', 'usual_location', 'current_driver', 'contractor_details', 'source_device_type'],
        allFeatures: [],
        extentFeatures: [],
        selectedDevices: [],
        historyFromDate: '',
        historyFromTime: '',
        historyToDate: '',
        historyToTime: '',
        historyRangeMilliseconds: 0,
        tints: {
          'red': [[fill,'#ed2727'], [stroke,'#480000']],
          'orange': [[fill,'#ff6600'], [stroke,'#562200']],
          'yellow': [[fill,'#ffd700'], [stroke,'#413104']],
          'green': [[fill,'#71c837'], [stroke,'#1b310d']],
          'selected': [['#000000', '#2199e8'], [stroke,'#2199e8'], [fill, '#ffffff']],
        },
      }
    },
    computed: {
      map: function () { return this.$root.$refs.app.$refs.map },
      annotations: function () { return this.$root.$refs.app.$refs.annotations },
      info: function () { return this.$root.info },
      setting: function () { return this.$root.setting },
      catalogue: function () { return this.$root.catalogue },
      export: function () { return this.$root.export },
      loading: function () { return this.$root.loading },
      features: function () {
        if (this.viewportOnly) {
          return this.extentFeatures
        } else {
          return this.allFeatures
        }
      },
      isTrackingMapLayerHidden:function() {
        return this.$root.active.isHidden(this.trackingMapLayer)
      },
      isHistoryMapLayerHidden:function() {
        return this.$root.active.isHidden(this.historyMapLayer)
      },
      selectedFeatures: function () {
        return this.features.filter(this.selected)
      },
      stats: function () {
        return Object.keys(this.extentFeatures).length + '/' + Object.keys(this.allFeatures).length
      },
      queryHistoryDisabled: function() {
        return !(this.selectedFeatures && this.selectedFeatures.length && this.historyFromDate && this.historyFromTime && this.historyToDate && this.historyToTime)
      },
      historyRange: {
        get: function () {
          return this.historyRangeMilliseconds
        },
        set: function (val) {
          this.historyRangeMilliseconds = val
          var currentDate = moment()
          this.historyToDate = currentDate.format('YYYY-MM-DD')
          this.historyToTime = currentDate.format('HH:mm')
          var fromDate = currentDate.subtract(val, 'milliseconds')
          this.historyFromDate = fromDate.format('YYYY-MM-DD')
          this.historyFromTime = fromDate.format('HH:mm')
        }
      },
      trackingLayer: function() {
        return this.$root.catalogue.getLayer('dpaw:resource_tracking_live')
      },
      trackingMapLayer: function() {
        return this.$root.map?this.$root.map.getMapLayer(this.trackingLayer):undefined
      },
      historyLayer: function() {
        return this.$root.catalogue.getLayer('dpaw:resource_tracking_history')
      },
      historyMapLayer: function() {
        return this.$root.map?this.$root.map.getMapLayer(this.historyLayer):undefined
      }
    },
    watch:{
      isTrackingMapLayerHidden:function(newValue,oldValue) {
        if (newValue === undefined || oldValue === undefined) {
            //layer is turned on or turned off
            return
        } else if (this.map.resolution >= 0.003) {
            //label is turned on, but resolution is not less than 0.003
            return
        } else {
            //label is enabled, hiding/showing tracking layer requires resetting the style text.
            this.trackingMapLayer.changed() 
        }
      },
      isHistoryMapLayerHidden:function(newValue,oldValue) {
        if (newValue === undefined || oldValue === undefined) {
            //layer is turned on or turned off
            return
        } else if (this.map.resolution >= 0.003) {
            //label is turned on, but resolution is not less than 0.003
            return
        } else {
            //label is enabled, hiding/showing tracking layer requires resetting the style text.
            this.historyMapLayer.changed() 
        }
      },
      resourceLabels:function(newValue,oldValue) {
        this.showResourceLabelsOrDirections()
      },
      resourceDirections:function(newValue,oldValue) {
        this.showResourceLabelsOrDirections()
      },
      "screenHeight":function(newValue,oldvalue) {
        this.adjustHeight()
      },
      "toggleHistory":function() {
        this.adjustHeight()
      }
    },
    methods: {
      adjustHeight:function() {
        if (this.activeMenu === "tracking") {
            $("#tracking-list").height(this.screenHeight - this.leftPanelHeadHeight - $("#tracking-list-controller-container").height())
        }
      },
      verifyDate: function(event,inputPattern,pattern) {
        var element = event.target;
        element.value = element.value.trim()
        if (element.value.length > 0) {
            var m = moment(element.value,inputPattern,true)
            if (!m.isValid()) {
                setTimeout(function() {
                    element.focus()
                },10);
            } else {
                element.value = m.format(pattern)
            }
        }
      },
      ago: function (time) {
        var now = moment()
        if (now.diff(moment(time), 'days') == 1) {
            return now.diff(moment(time), 'days') + ' day'
        } else if ((now.diff(moment(time), 'days') > 1)) {
            return now.diff(moment(time), 'days') + ' days'
        } else if ((now.diff(moment(time), 'hours') == 1)) {
            return now.diff(moment(time), 'hours') + ' hr'
        } else if ((now.diff(moment(time), 'hours') > 1)) {
            return now.diff(moment(time), 'hours') + ' hrs'
        } else if ((now.diff(moment(time), 'minutes') == 1)) {
            return now.diff(moment(time), 'minutes') + ' min'
        } else if ((now.diff(moment(time), 'minutes') < 1)) {
            return '<1 min'
        } else {
            return now.diff(moment(time), 'minutes') + ' mins'
        }
      },
      toggleSelect: function (f) {
        if (this.selected(f)) {
          this.$root.annotations.selectedFeatures.remove(f)
        } else {
          this.$root.annotations.selectedFeatures.push(f)
        }
      },
      toggleViewportOnly: function () {
        this.viewportOnly = !this.viewportOnly
        this.export.saveState()
      },
      toggleResourceLabels: function () {
        var vm = this
        this.resourceLabels = !this.resourceLabels
        this.export.saveState()
      },
      showResourceLabelsOrDirections:function() {
        var vm = this
        $.each([this.trackingMapLayer,this.historyMapLayer],function(index,mapLayer){
            if (mapLayer && !vm.$root.active.isHidden(mapLayer)) {
                mapLayer.changed()
            }
        })
      },
      toggleResourceDirections: function () {
        var vm = this
        this.resourceDirections = !this.resourceDirections
        this.export.saveState()
      },
      featureIconSrc:function(f) {
        var vm = this
        //trigger dynamic binding
        var tmp = vm.selectedDevices
        return this.map.getBlob(f, ['icon', 'originalTint'],this.tints,function(){
            $("#device-icon-" + f.get('id')).attr("src", vm.featureIconSrc(f))
        })
      },
      selected: function (f) {
        return f.get('deviceid') && (this.selectedDevices.indexOf(f.get('deviceid')) > -1)
      },
      downloadList: function () {
        this.$root.export.exportVector(this.features.filter(this.resourceFilter).sort(this.resourceOrder), 'trackingdata')
      },
      downloadSelectedCSV: function () {
          var deviceFilter = ''
          if (this.selectedDevices.length > 0) {
              deviceFilter = 'deviceid__in=' + this.selectedDevices.join(',')
          }
          return deviceFilter
      },
      clearHistory: function () {
          var historyLayer = this.historyLayer
          if (!this.toggleHistory) {
              historyLayer.cql_filter = "clearhistorylayer"
              this.$root.catalogue.onLayerChange(historyLayer, false)
          }
      },
      updateCQLFilter: function (updateType) {
        var vm = this
        if (!vm._updateCQLFilter) {
            vm._updateCQLFilter = debounce(function(updateType){
                var groupFilter = vm.cql
                var deviceFilter = ''
                // filter by specific devices if "Show selected only" is enabled
                if ((vm.selectedDevices.length > 0) && (vm.selectedOnly)) {
                  deviceFilter = 'deviceid in (' + vm.selectedDevices.join(',') + ')'
                }
                // CQL statement assembling logic
                if (groupFilter && deviceFilter) {
                  vm.trackingLayer.cql_filter = '(' + groupFilter + ') and (' + deviceFilter + ')'
                } else if (deviceFilter) {
                  vm.trackingLayer.cql_filter = deviceFilter
                } else {
                  vm.trackingLayer.cql_filter = groupFilter
                }
                if (!deviceFilter && vm.selectedOnly) {
                    vm.selectedOnly = false
                }
                if (updateType === "selectedDevice" && deviceFilter) {
                    //chosed some device
                    var filteredFeatures = vm.trackingMapLayer.getSource().getFeatures().filter(function(f){
                        return vm.selectedDevices.indexOf(f.get('deviceid')) >= 0
                    })
                    vm.trackingMapLayer.getSource().clear()
                    vm.trackingMapLayer.getSource().addFeatures(filteredFeatures)
                    $.each(filteredFeatures,function(index,feature){
                        vm.annotations.tintSelectedFeature(feature)
                    })
                    vm.updateResourceFilter(true)
                } else {
                    //clear device filter or change other filter
                    vm.trackingMapLayer.set('updated', moment().toLocaleString())
                    vm.trackingMapLayer.getSource().loadSource("query")
                }
            },500)
        }
        vm._updateCQLFilter(updateType)
      },
      historyCQLFilter: function () {
        var vm = this
        var historyLayer = this.historyLayer
        var deviceFilter = 'deviceid in (' + this.selectedDevices.join(',') + ')'
        historyLayer.cql_filter = deviceFilter + "and seen between '" + this.historyFromDate + ' ' + this.historyFromTime + ":00' and '" + this.historyToDate + ' ' + this.historyToTime + ":00'"
        if (!this.$root.catalogue.onLayerChange(historyLayer, true)) {
            //history layer is already turned on, manually load the history source
            var source = this.$root.map.getMapLayer(historyLayer).getSource()
            source.loadSource("query")
        }
      },
      resourceFilter: function (f) {
        var search = ('' + this.search).toLowerCase()
        var found = !search || this.fields.some(function (key) {
          return ('' + f.get(key)).toLowerCase().indexOf(search) > -1
        })
        if (this.selectedOnly && this.selectedFeatures.length) {
          return this.selected(f) && found
        };
        return found
      },
      resourceOrder: function (a, b) {
        var as = a.get('seen')
        var bs = b.get('seen')
        if (as < bs) {
          return 1
        } else if (as > bs) {
          return -1
        }
        return 0
      },
      zoomToSelected: function () {
        var extent = ol.extent.createEmpty()
        this.selectedFeatures.forEach(function (f) {
          ol.extent.extend(extent, f.getGeometry().getExtent())
        })
        var map = this.$root.map.olmap
        map.getView().fit(extent, map.getSize())
      },
      updateResourceFilter: function(runNow) {
        var vm = this
        var updateResourceFilterFunc = function() {
            // syncing of Resource Tracking features between Vue state and OL source
            var mapLayer = vm.trackingMapLayer
            if (!mapLayer) { return }
            // update vue list for filtered features in the current extent
            vm.extentFeatures = mapLayer.getSource().getFeaturesInExtent(vm.$root.map.extent).filter(vm.resourceFilter)
            vm.extentFeatures.sort(vm.resourceOrder)
            // update vue list for filtered features
            vm.allFeatures = mapLayer.getSource().getFeatures().filter(vm.resourceFilter)
            vm.allFeatures.sort(vm.resourceOrder)
        }
        if (runNow) {
            updateResourceFilterFunc()
        } else {
            if (!vm._updateResourceFilter) {
                vm._updateResourceFilter = debounce(function(){
                    updateResourceFilterFunc()
                },700)
            }
            vm._updateResourceFilter()
        }
      },
      updateViewport: function(runNow) {
        var vm = this
        var updateViewportFunc = function() {
            // syncing of Resource Tracking features between Vue state and OL source
            var mapLayer = vm.trackingMapLayer
            if (!mapLayer) { return }
            var feats = mapLayer.getSource().getFeatures()
            // update vue list for filtered features in the current extent
            vm.extentFeatures = mapLayer.getSource().getFeaturesInExtent(vm.$root.map.extent).filter(vm.resourceFilter)
            vm.extentFeatures.sort(vm.resourceOrder)
        }
        if (runNow) {
            updateViewportFunc()
        } else {
            if (!vm._updateViewport) {
                vm._updateViewport = debounce(function(){
                    updateViewportFunc()
                },100)
            }
            vm._updateViewport()
        }
      },
      setup: function() {
        // enable resource tracking layer, if disabled
        var catalogue = this.$root.catalogue
        if (!this.trackingMapLayer) {
          catalogue.onLayerChange(this.trackingLayer, true)
        }

        this.$root.annotations.selectable = [this.trackingMapLayer]
        this.annotations.setTool()

        this.$nextTick(this.adjustHeight)
      }
    },
    ready: function () {
      var vm = this
      var trackingStatus = this.loading.register("tracking","Resource Tracking Component","Initialize")
      var map = this.$root.map

      var resourceTrackingStyleFunc = function(layerId){
        return function (res) {
            var feat = this
            // cache styles for performance
            var style = vm.map.cacheStyle(function (feat) {
              var src = vm.map.getBlob(feat, ['icon', 'tint'],vm.tints)
              if (!src) { return false }
              return new ol.style.Style({
                image: new ol.style.Icon({
                  src: src,
                  scale: 0.5,
                  snapToPixel: true
                }),
                text: new ol.style.Text({
                  offsetX: 12,
                  textAlign: 'left',
                  font: '12px Helvetica,Roboto,Arial,sans-serif',
                  stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 4
                  })
                }),
                stroke: new ol.style.Stroke({
                  color: [52, 101, 164, 0.6],
                  width: 4.0
                })
              })
            }, feat, ['icon', 'tint'])
            if (style.getText) {
              if (res < 0.003 && vm.resourceLabels && !vm.$root.active.isHidden(vm.map.getMapLayer(layerId))) {
                style.getText().setText(feat.get('label'))
              } else {
                style.getText().setText('')
              }
            }
            if (res < 0.003 && vm.resourceDirections) {
              var heading = feat.get('heading')
              var speed = feat.get('velocity')
              if (heading !== undefined && (heading !== 0 || speed !== 0)) {
                  //style.getImage().setRotation( (heading + 90) / 180 * Math.PI )
                  if (!vm.directionStyle) {
                      vm.directionStyle = new ol.style.Style({
                          image: new ol.style.Icon({
                              src: "/dist/static/symbols/device/direction.svg",
                              scale:1,
                              snapToPixel:true
                          })
                      })
                  }
                  vm.directionStyle.getImage().setRotation(heading / 180 * Math.PI)
                  if (Array.isArray(style)) {
                      style.splice(0,0,vm.directionStyle)
                  } else {
                      style =  [vm.directionStyle,style]
                  }
              }
            }
            return style
          }
      }

      var deviceLabel = function(device) {
        var name = ''
        var rin_symbols = ['heavy duty','gang truck','dozer','loader','grader','tender','float'];
        var symbol = device.get('symbol');
        var district = device.get('district_display');
        var callsign_display = device.get('callsign_display');
        var registration = device.get('registration');
        if (!district || district == 'Aviation' || district == 'Other'){
            if (!callsign_display || rin_symbols.indexOf(symbol) === -1){
                name = registration
            } else {
                name = callsign_display +' '+ registration
            }
        } else {
            if (!callsign_display || rin_symbols.indexOf(symbol) === -1){
                name = district +' '+ registration
            } else {
                name = callsign_display +' '+ registration
            }
        }
        return name
      }

      var addResourceFunc = function(styleFunc) {
        return function (f) {
            var now = moment()
            var timestamp = moment(f.get('seen'))
            var tint = 'red'
            if (now.diff(timestamp, 'hours') < 24) {
              tint = 'orange'
            };
            if (now.diff(timestamp, 'hours') < 3) {
              tint = 'yellow'
            };
            if (now.diff(timestamp, 'hours') < 1) {
              tint = 'green'
            };
            f.set('icon', 'dist/static/symbols/device/' + f.get('symbolid') + '.svg',true)
            f.set('tint', tint,true)
            f.set('originalTint', tint,true)
            f.set('label', deviceLabel(f), true)
            f.set('time', timestamp.toLocaleString(),true)
            // Set a different vue template for rendering
            f.set('partialId', 'resourceInfo',true)
            // Set id for select tools
            f.set('selectId', f.get('deviceid'),true)
            f.setStyle(styleFunc,true)
        }
      }

      var deviceExtraHoverLabel = function(device) {
          var rin_symbols = ['heavy duty','gang truck','dozer','loader','grader','tender','float'];
          var symbol = device.get('symbol');
          var return_label = ''
          var callsign_label = ''
          var callsign_display = device.get('callsign_display');
          var c_label = ''
          var u_label = ''
          var c_driver = ' ' + (device.get("current_driver") || '');
          var u_driver = ' ' + (device.get("usual_driver") || '');
          var u_location = ' ' + (device.get("usual_location") || '');
          var contractor_label = "Contractor: " + (device.get("contractor_details") || '');

          // Set "Callsign" Label for "Light vehicles" (no RIN)
          
          if (callsign_display && rin_symbols.indexOf(symbol) === -1) {
              callsign_label = "Callsign: " + callsign_display
          }

          // Set "Usual" Label
          if (u_driver != ' ') {
              u_label += "Usual driver:" + u_driver
              if (u_location != ' '){
                  u_label += ", Location:" + u_location
              }
          } else if (u_location != ' '){
              u_label += "Usual location:" + u_location
          }

          // Set "Current" Label
          if (c_driver != ' ') {
              c_label += "Current driver:" + c_driver
          }

          // Generate Full Label
          if (callsign_label != ''){
              return_label += callsign_label
          }
          if (callsign_label != '' & c_label != ''){
              return_label += '<br>' + c_label
          } else if (c_label != ''){
              return_label += c_label
          }
          if ((c_label != '' || callsign_label != '') && u_label != ''){
              return_label += '<br>' + u_label
          } else if (u_label != ''){
              return_label += u_label
          }
          if ((c_label != '' || u_label != '') && contractor_label != 'Contractor: '){
              return_label += '<br>' + contractor_label
          } else if (contractor_label != 'Contractor: '){
              return_label += contractor_label
          }

          return return_label
      }

      this.$root.fixedLayers.push({
        type: 'WFSLayer',
        name: 'Resource Tracking',
        id: 'dpaw:resource_tracking_live',
        onadd: addResourceFunc(resourceTrackingStyleFunc('dpaw:resource_tracking_live')),
        getFeatureInfo:function (f) {
			var extra_device_label = deviceExtraHoverLabel(f)
            return {name:f.get("label"), img:map.getBlob(f, ['icon', 'tint']),
                comments:"(" + vm.ago(f.get("seen")) + " ago, Heading:" + f.get("heading") + "&deg;)<br>" +
                    extra_device_label}
        },
        refresh: 60,
        onload: function(loadType,vectorSource,features,defaultOnload) {
            function processResources() {
                defaultOnload(loadType,vectorSource,features)
                if (vm.selectedDevices.length > 0) {
                    var deviceIds = vm.selectedDevices.slice()
                    vm.$root.annotations.selectedFeatures.clear()
                    features.filter(function(el, index, arr) {
                      var id = el.get('deviceid')
                      if (!id) return false
                      if (deviceIds.indexOf(id) < 0) return false
                      return true
                    }).forEach(function (el) {
                      vm.$root.annotations.selectedFeatures.push(el)
                    })
                }
                vm.updateResourceFilter(true)
            }
            if (features.length > 0) {
                var f = features.find(function(f) {return f.get('source_device_type') != "tracplus"})
                if (f){
                    utils.checkPermission(vm.sssService + "/sss_admin/tracking/device/" + f.get('id') + "/change/",function(allowed){
                        vm.whoami.editVehicle = allowed
                        processResources()
                    })
                } else {
                    vm.whoami.editVehicle = false
                    processResources()
                }
            } else {
                vm.whoami.editVehicle = false
                processResources()
            }
        }
      }, {
        type: 'WFSLayer',
        name: 'Resource Tracking History',
        id: 'dpaw:resource_tracking_history',
        onadd: function(addResource) {
            return function(f){
                if (f.getGeometry() instanceof ol.geom.Point) {
                    addResource(f)
                }
            }
        }(addResourceFunc(resourceTrackingStyleFunc('dpaw:resource_tracking_history'))),
        cql_filter: false,
        getFeatureInfo:function (f) {
            if (f.getGeometry() instanceof ol.geom.Point) {
                var name = deviceLabel(f)
                var extra_device_label = deviceExtraHoverLabel(f)
                return {name:name, img:map.getBlob(f, ['icon', 'tint']),
                    comments:"(" + f.get("label") + ", Heading:" + f.get("heading") + "&deg;)<br>" +
                        extra_device_label}
            } else {
                return {name:f.get("name"), img:map.getBlob(f, ['icon', 'tint']), comments:"(" + f.get("startTime") + " - " + f.get("endTime") + ")"}
            }
        },
        onload: function(loadType,vectorSource,features,defaultOnload) {
            defaultOnload(loadType,vectorSource,features)
            // callback to draw the line trail after the points information is loaded
            var devices = {}
            // group by device
            features.forEach(function (feature) {
                var props = feature.getProperties()
                if (!(props.name in devices)) {
                  devices[props.name] = []
                }
                devices[props.name].push(feature)
            })
            Object.keys(devices).forEach(function (device) {
                // sort by timestamp
                devices[device].sort(vm.resourceOrder)
                // pull the coordinates
                var coords = devices[device].map(function (point) {
                    point.set('label', moment(point.get('seen')).format('MMM DD HH:mm')) 
                    return point.getGeometry().getCoordinates()
                })
                // create a new linestring
                var f = devices[device][0]
                var name = deviceLabel(f)
                var feature = new ol.Feature({
                  name: name + ' path',
                  icon: f.get('icon'),
                  tint: f.get('tint'),
                  endTime: moment(f.get('seen')).format('MMM DD HH:mm'),
                  startTime: moment(devices[device][devices[device].length - 1].get('seen')).format('MMM DD HH:mm'),
                  geometry: new ol.geom.LineString(coords)
                })
                vectorSource.addFeature(feature)
            })
        }

      })

      trackingStatus.wait(40,"Listen 'gk-init' event")
      // post init event hookup
      this.$on('gk-init', function () {
        trackingStatus.progress(80,"Process 'gk-init' event")
        map.olmap.getView().on('propertychange', vm.updateViewport)

        /*var layersAdded = global.debounce(function () {
          var mapLayer = vm.trackingMapLayer
          if (!mapLayer) { return }
          if (!mapLayer.get('tracking')) {
            mapLayer.set('tracking', mapLayer.getSource().on('loadsource', viewChanged))
          }
        }, 100)
        map.olmap.getLayerGroup().on('change', layersAdded)
        layersAdded()*/

        this.$root.annotations.selectedFeatures.on('add', function (event) {
          if (event.element.get('deviceid')) {
            vm.selectedDevices.push(event.element.get('deviceid'))
            if (vm.selectedOnly) {
                vm.updateCQLFilter('selectedDevice')
            }
          }
        })
        this.$root.annotations.selectedFeatures.on('remove', function (event) {
          if (event.element.get('deviceid')) {
            vm.selectedDevices.$remove(event.element.get('deviceid'))
            if (vm.selectedOnly) {
                vm.updateCQLFilter('selectedDevice')
            }
          }
        })
        //vm.annotations.setDefaultTool('tracking','Pan')
        vm.tools = vm.annotations.tools.filter(function (t) {
          return t.scope && t.scope.indexOf("resourcetracking") >= 0
        })
        trackingStatus.end()
      })
    }
  }
</script>
