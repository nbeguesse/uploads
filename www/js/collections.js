  hls.Collection = Backbone.Collection.extend({


  });
hls.CarList = hls.Collection.extend({
  url: function(){
    return hls.server+"/users/"+this.user.id+"/cars.json";
  },
  model:hls.Car,
  update:function(){
    _.each(hls.user.cars.models, function(car){
      if(car.isNew()){
        car.save();
      }
    });
    this.fetch({remove:false}); //TODO: Set remove to false
  },
});
hls.ImageList = hls.Collection.extend({
  model:hls.Image,

});