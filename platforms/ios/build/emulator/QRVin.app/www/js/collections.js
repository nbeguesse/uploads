hls.Collection = Backbone.Collection.extend({


});
hls.CarList = hls.Collection.extend({
  url: function(){
    return hls.server+"/users/"+this.user.id+"/cars.json";
  },
  model:hls.Car,
  setPendingTransaction: function(carId){
    this.get(carId).set('pending_transaction',true);
  },
  getTransactionCar: function(){
    return this.where({pending_transaction:true})[0];
    
  },
});

hls.ImageList = hls.Collection.extend({
  model:hls.Image,
  url:function(){
    return hls.server+"/cars/"+this.car.get('id')+"/upload_image.json"
  },
  initialize:function(){
    this.bind('add', this._add, this);
    this.bind('remove', this._remove, this);
    return this;
  },
  _add:function(image){
    image.car = this.car;
    image.save(); //this will upload image to server
  },
  _remove:function(image){
    console.log('removing image....');
     $.ajax({
      dataType: "jsonp",
      url: hls.server+"/cars/"+image.car.id+"/images/"+image.id+"/delete.js",
      data:{}
    });
  }

});
hls.PaymentList = hls.Collection.extend({
  model:hls.Payment,
});