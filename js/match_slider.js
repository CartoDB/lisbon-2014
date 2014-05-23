
  var MatchSlider = cdb.geo.ui.TimeSlider.extend({


    defaultTemplate: '',

    initialize: function() {
      this.defaultTemplate = this.options.template;
      cdb.geo.ui.TimeSlider.prototype.initialize.call(this)
    }

  });