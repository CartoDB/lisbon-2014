
  var URL = 'http://cartodb.github.io/lisbon-2014/#/';
  var SHARE_TEXT = 'Champions League 2014 Tweets - ';
  var torqueLayer;
  var map;

  function main() {
  
    cdb.vis.Overlay.register('match_slider', function(data, viz) {
      data.template = $('#match_slider').html(); 
      var slider = new MatchSlider(data);
      return slider.render();
    });

    // share content
    cdb.vis.Overlay.register('share', function(data, vis) {

      // Add the complete url for facebook and twitter
      if (location.href) {
        data.share_url = encodeURIComponent(location.href);
      } else {
        data.share_url = data.url;
      }

      var template = cdb.core.Template.compile(
        data.template || '\
          <div class="mamufas">\
            <div class="block modal {{modal_type}}">\
              <a href="#close" class="close">x</a>\
              <div class="head">\
                <h3>Share this map</h3>\
              </div>\
              <div class="content">\
                <div class="buttons">\
                  <h4>Social</h4>\
                  <ul>\
                    <li><a class="facebook" target="_blank" href="{{ facebook_url }}">Share on Facebook</a></li>\
                    <li><a class="twitter" href="{{ twitter_url }}" target="_blank">Share on Twitter</a></li>\
                    <li><a class="link" href="{{ public_map_url }}" target="_blank">Link to this map</a></li>\
                  </ul>\
                </div><div class="embed_code">\
                 <h4>Embed this map</h4>\
                 <textarea id="" name="" cols="30" rows="10">{{ code }}</textarea>\
               </div>\
              </div>\
            </div>\
          </div>\
        ',
        data.templateType || 'mustache'
      );

      var url = location.href;

      url = url.replace("public_map", "embed_map");

      var public_map_url = url.replace("embed_map", "public_map"); // TODO: get real URL

      var code = "<iframe width='100%' height='520' frameborder='0' src='" + url + "' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>";

      var dialog = new cdb.ui.common.ShareDialog({
        title:        "Real Madrid v Atlético Madrid: how the #UCL final played out on Twitter",
        description:  "Visualization about the amount of tweets during 2014 Champions League final between Real Madrid and Atlético de Madrid",
        model: vis.map,
        code: code,
        url: data.url,
        public_map_url: public_map_url,
        share_url: data.share_url,
        template: template,
        target: $(".cartodb-share a"),
        size: $(document).width() > 400 ? "" : "small",
        width: $(document).width() > 400 ? 430 : 216
      });

      return dialog.render();

    });





    cartodb.createVis('map', 'http://srogers.cartodb.com/api/v2/viz/a43ea07a-e3f2-11e3-92f9-0e230854a1cb/viz.json', {
      center_lat: 24.5,
      center_lon: -7,
      zoom: 2,
      time_slider: false,
      fullscreen: true
    })
      .done(function(vis, layers) {

        vis.map.set({
          minZoom: 1,
          maxZoom: 10
        });

        map = vis.getNativeMap();
        var layer = layers[2];

        var hash = new L.Hash(map, layer);

        var share = vis.addOverlay({
          type: 'share',
          layer: layer
        })

        slider = vis.addOverlay({
          type: 'match_slider',
          layer: layer
        });
        
        torqueLayer = layer;
        torqueLayer.stop();

        torqueLayer.on('load', onTorqueLoad);
        torqueLayer.on('change:time', checkTime);
      })
      .on('error', manageError);
  }

  function onTorqueLoad() {
    torqueLayer.play();
    drawStartEnd();
  }

  function manageError(err, layer) {
    $('#not_supported_dialog').show();
    // hide all the overlays
    var overlays = this.getOverlays()
    for (var i = 0; i < overlays.length; ++i) {
      var o = overlays[i];
      o.hide && o.hide();
    }
  }

  function checkTime(data) {

    _.each(match_data.highlights, function(d,i) {
      
      // Block
      var block = d.team.indexOf('Atlético') !== -1 ? 'atletico' : 'madrid';

      if (new Date(data.time) >= new Date(i)) {
        
        if (!d.el) {

          var div = $('<div>').addClass('highlight ' + block);

          div.append($('<i>')
              .addClass("icon " + d.type + " ")
              .attr('data-tipsy', d.text)
              .append(d.type));
          
          div.append($('<span>').addClass('line'));

          d.el = div;

          var pos = getHighlightPos(new Date(i).getTime());

          // Position
          d.el.css({
            left: pos + "%"
          });

          $('.highlights').find('.' + block + ' .timeline').append(d.el);

          generateTooltip(d, i);

          if (d.type === "goal") {
            var goals = parseInt($('em.' + block).text());
            $('em.' + block).text(++goals);
          }
        }

        d.el.show();
      } else {
        
        if (d.el && d.type === "goal") {
          var goals = parseInt($('em.' + block).text());
          $('em.' + block).text(--goals);
        }

        if (d.el) {
          d.el.hide();
          destroyTooltip(d.el.find('i'));
          d.el.remove();

          delete d.el;
        }
      }
      
    })
  }

  function destroyTooltip($el) {
    $el.unbind('click');
    var tipsy = $el.data('tipsy');
    if (tipsy.$tip) {
      tipsy.$tip.remove();
    }
  }

  function closeTipsys() {
    $('i').each(function() {
      if ($(this).data('tipsy')) {
        $(this).tipsy('hide');
      }
    });
  }

  function getURL(timestamp) {
    var tb = torqueLayer.getTimeBounds();
    var step = Math.floor(((timestamp-tb.start)*tb.steps)/(tb.end-tb.start));
    var center = map.getCenter();
    return encodeURIComponent(URL + map.getZoom() + "/" + center.lat + "/" + center.lng + "/" + step)
  }

  function getShareText(d) {
    return SHARE_TEXT + d.text.replace(/<(?:.|\n)*?>/gm, '');
  }

  function generateTooltip(d, t) {

    var $el = d.el.find('i')
    var url = getURL(new Date(t).getTime());
    
    $el.tipsy({
      trigger:  'manual',
      title:    function() {
        return this.getAttribute('data-tipsy') +
        '<div class="highlight-share">' + 
        '<p>Share this moment</p>' + 
        '<span class="buttons">' +
        '<a target="_blank" href="http://www.facebook.com/sharer.php?u=' + url + '&text=' + getShareText(d) + '" class="facebook"></a>'+
        '<a target="_blank" href="https://twitter.com/share?url=' + url + '&text=' + getShareText(d) + '" class="twitter"></a>'+
        '</span>'+
        '</div>'
      },
      html:     true,
      gravity:  $.fn.tipsy.autoBounds(250, 's'),
      fade:     true,
      delayIn:  300,
      delayOut: 750
    })

    $el.click(function(){
      closeTipsys();

      var $i = $(this);
      $i.tipsy('show');
      
      setTimeout(function() {
        $i.data('tipsy').$tip.bind('mouseleave', function(){
          $i.tipsy('hide');
        });
      },600);
    })
  }

  function getHighlightPos(timestamp)  {
    var tb = torqueLayer.getTimeBounds();
    return ((timestamp-tb.start)*100)/(tb.end-tb.start);
  }

  function drawStartEnd() {

    if ($('.icon.start').length > 0) {
      return false;
    }

    // Draw start
    var div = $('<div>').addClass('highlight');
    div.append($('<i>').addClass("icon start"));
    div.append($('<span>').addClass('separator'));
    div.append($('<p>').text(match_data.start.text));
    var pos = getHighlightPos(new Date(match_data.start.time).getTime());
    
    div.css({ left: pos + "%" });
    $('.highlights .timeslider').find('.wrap_slider')
      .append(div)
      .append(
        $('<span>')
          .addClass('slider_mamufas start')
          .css({
            left: 0,
            width: pos + '%'
          })
      );

    // Draw end
    var div = $('<div>').addClass('highlight');
    div.append($('<i>').addClass("icon end"));
    div.append($('<span>').addClass('separator'));
    div.append($('<p>').text(match_data.end.text));
    var pos = getHighlightPos(new Date(match_data.end.time).getTime());
    
    div.css({ left: pos + "%" });
    $('.highlights .timeslider').find('.wrap_slider')
      .append(div)
      .append(
        $('<span>')
          .addClass('slider_mamufas end')
          .css({
            right: 0,
            left: pos + "%"
          })
      );
  }

  window.onload = main;