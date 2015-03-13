hls.CarList = null;
hls.ImageList = null;

hls.Model = Backbone.Model.extend({

});

hls.Store = hls.Model.extend({
   defaults:{
     state:"Store Not Available.",
     productId:"cc.fovea.purchase.consumable2",
   },  
  initStore:function(){
    if (!window.store) {
        console.log('Store not available');
        return;
    } 
    store.register({
        id:    this.get('productId'),
        alias: 'car vin',
        type:   store.CONSUMABLE
    });
    // Log all errors
    store.error(function(error) {
        console.log('ERROR ' + error.code + ': ' + error.message);
    });
    // When any product gets updated, refresh the HTML.
    store.when("product").updated(function (p) {
        if (!p.loaded) {
          window.hls.store.set({state:"Loading..."});
        } else if (!p.valid) {
          window.hls.store.set({state:"Please try again later."});
        } else if (p.valid && p.canPurchase) {
          window.hls.store.set({state:"ready", title:p.title, description:p.description});
        }
    });
    store.when("product").approved(function (order) {
      hls.store.approveProduct(order);
    });
    store.when("product").refunded(function (order) {
      //In-app billing does not allow users to send a refund request to Google Play. 
      //Refunds for in-app purchases must be directed to you (the application developer). 
      //You can then process the refund through your Google Wallet merchant account. 
      //When you do this, Google Play receives a refund notification from Google Wallet, 
      //and Google Play sends a refund message to your application.
    });
    //
    // Note that the "ready" function will be called immediately if the store
    // is already ready.
    // store.ready(function() {
    //   //hide loading indicator
    // });
    store.refresh();
  },
  approveProduct:function(order){
      if(hls.user.loggedIn()){
        //update the car
        var car = hls.user.cars.getTransactionCar();
        if( _.isUndefined(car)){
          order.finish();
          return true;
        }
        //notify the server
        var price = order.price.replace("$","");
        app.currentPage.getUrl(car.payLink, {

          data:hls.util.addAccessToken({transaction:order.transaction, price:price}),
          success: function(data){

            order.finish();
          }
         });
      } else {
        //alert('Please log in to complete pending transactions.');
      }
  },
  order:function(carId){
    hls.user.cars.setPendingTransaction(carId);
    hls.user.saveToFile(); //save the pending car in case purchase is interrupted.
    window.store.order(this.get('productId'));
  }

});

hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    scanVin:function(options){ 
      this.success = options.success;     
      if(!hls.emulated){

        if (cordova.plugins.zbarScanner && navigator.userAgent.match(/iPhone|iPad|iPod/i)) { // We must make sure it's triggered ONLY for iOS

          cordova.plugins.zbarScanner.scan( this.scanSuccess, this.scanError ); //Zbar for ios only

        } else {
          cordova.plugins.barcodeScanner.scan( this.scanSuccess, this.scanError ); //ZXING Scanner for Android and ioS
        }
      } else {
        
        alert('Barcode API not supported. Using sample data.');
        this.scanSuccess({text:"1C6RR6LT1DS560200", format:"Code_39", cancelled:false});
      }
    },
    takePicture:function(options){
      this.success = options.success; 
      if(navigator.camera){

        var options = { quality : 50,
          destinationType : Camera.DestinationType.FILE_URI,
          sourceType : Camera.PictureSourceType.CAMERA, //CAMERA or PHOTOLIBRARY
          allowEdit : true,
          encodingType: Camera.EncodingType.JPEG,
          saveToPhotoAlbum: false }
        navigator.camera.getPicture(this.cameraSuccess, this.cameraError, options)
    
      } else {
        alert('Camera API not supported. Using sample picture.');
        this.cameraSuccess("http://s3.amazonaws.com/highlinesale-beta-images/photos/67458/1104868/big.JPG?1393038514");
      }
    },
    cameraSuccess:function(data){
      var image = new hls.Image({file_url:data, thumbnail:data});
      app.currentPage.model.images.add(image);
    },
    cameraError:function(message){
      //fail silently!
      console.log('camera error',message);
    },
    scanSuccess:function(result){
      if(!result.cancelled){
        if(result.text.length == 17) {
          console.log('we got a vin!');
          app.currentPage.scanSuccess(result.text);
        } else if(result.text.indexOf("http://v.ford.com") == 0){
          var vin = hls.util.gup("v",result.text);
           app.currentPage.scanSuccess(vin);
        } else {
          //fail silently; alert box causes program freeze in ios
          //alert("The VIN was only partially scanned.");
        }
      }
    },
    scanError:function(message){
     //fail silently!
    },
});
hls.Car = hls.Model.extend({
   defaults:{
     year:null,
     make:null,
     make_id:null,
     model:null,
     model_id:null,
     style:null,
     style_id:null,
     image_files:[],
     pending_transaction:false,
     "is_paid?":false,
   },
    url: function(){
      if(this.isNew()){
        return hls.server+"/cars";
      } else {
        return hls.server+"/cars/"+this.get('id'); //not used. requires CORS and such
      }
    },
    initialize:function(){

      if(this.isNew()){ 
        //never used!
        //this.showLink = "#cars/0";
        //this.editLink = "#cars/0/edit";
      } else {
        this.showLink = "#cars/"+(this.get('id'));
        this.editLink = "#cars/"+(this.get('id'))+"/edit";
        this.payLink = hls.server+"/cars/"+this.get('id')+"/mobile_pay"
        this.pdfLink = hls.server+"/cars/"+this.get('id')+"/window_sticker.html"
      }
      this.images = new hls.ImageList(this.get('image_files')); 
      this.images.car = this;

      
      return this;
    },
    installOption:function(optionId, installed){
      var temp = this.get('options'); 
      temp[optionId].installed = installed;
      this.set({options:temp});
      //sync with server
      $.ajax({
        dataType: "jsonp",
        url: hls.server+"/cars/"+this.get('id')+"/update_option",
        data:{installed:installed, option_id:optionId}
      });
    },

    // toJSON: function() { 
      
    //   var temp = {};
    //   temp.options = JSON.stringify(this.get('options')); //send options as string instead of JSON object
      
    //   return temp;
    // },
    // Enable CORS on the server before doing this
    // push:function(){ //use this instead of Backbone.sync
    //  console.log('in push');
    //  hls.user.saveToFile();
    //   $.ajax({
    //     dataType: "json",
    //     url: this.url(),
    //     data:hls.util.addAccessToken({car: this.toJSON()}),
    //     type:"POST",
        
    //   });

    // },
    description:function(){
        var parts = [this.get('year'), this.get('make'), this.get('model')];
        var out = parts.join(" ");
        if(out=="  "){ out = "Your Car"}
        return out;
    },
    toParam:function(){
      return {
              year:this.get('year'),
              make:this.get('make') || "",
              make_id:this.get('make_id') || "",
              model:this.get('model') || "",
              model_id:this.get('model_id') || "",
              chrome_style_id:this.get('style_id') || ""              
            }
    },
    getInstalledOptions:function(){
       var temp = _.filter(this.get('options'), function(i){ return i.installed; });
       temp.push({name:"OTHER", invoice:{highValue:795, lowValue:795}, code:"", msrp:{highValue:795, lowValue:795}, installed:true, value:"DESTINATION CHARGE"});
       return temp;
    },
    getWasNewPrice:function(){
      var out = null;
      var msrp = this.get('msrp_price');
      if(msrp && msrp > 0){
        out = msrp;
        _.each(this.getInstalledOptions(), function(o){
          if(o.msrp){
            out += parseInt(o.msrp.highValue);
          }
        });
      }
      return out
    },
    shouldShowWindowSticker:function(){
      if (!hls.use_in_app_purchases){
        return true;
      }
      return this.get("is_paid?");
    },

});
hls.Image = hls.Model.extend({
    url:function(){
      return hls.server+"/cars/"+this.car.get('id')+"/upload_image.json"
    },
    initialize:function(){
        return this;
    },
    save: function(fileEntry){
      console.log('in image save');
      var imageURI = this.get('file_url');
      if(navigator.camera){
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";

        var params = {};
        params.kind = "0";

        options.params = params;

        var ft = new FileTransfer();
        ft.upload(imageURI, encodeURI(this.url()), this.win, this.fail, options);
      }
    },
    win:function(r){
      data = JSON.parse(r.response);
      if(data.error){
        alert("Upload Error: " + data.error);
      } else {
        //save new image path and thumbnail path
        hls.user.cars.get(data.car_id).images.get(data.id).set(data);
      }
    },
    fail:function(error){
      alert("An upload error has occurred: Code = " + error.code);

    }
});

hls.Payment = hls.Model.extend({
});

hls.UserModel = hls.Model.extend({
    initialize:function(){
        this.cars = new hls.CarList(); 
        this.cars.user = this;
        this.payments = new hls.PaymentList();
        return this;
    },
    getFileKey:function(){
      return "user2";
    },
    //get the current car(may or may not be blank)
    get_curr_car:function(){
      if(!this.curr_car){
        this.curr_car = this.get_new_car(); //the current car to attach the images to
      }
      return this.curr_car;
    },
    //get a blank car
    get_new_car:function(){ 
      if(this.curr_car && this.curr_car.isNew()){
        return this.curr_car;
      }
      var temp = new hls.Car(); 
      this.cars.add(temp);
      return temp;
    },
    loadFromFile:function(){
      console.log('in load from file');
      var value = window.localStorage.getItem(this.getFileKey());
      if(!_.isString(value)){
        console.log('no data yet');
        return;
      }
      var data = JSON.parse(value);
      this.set(data.user);
      this.cars.set(data.user.cars, {remove:false});
      this.payments.set(data.user.payments);
      //reload the homepage using changePage instead of app.navigate since we are already on the homepage
      app.welcome();
      console.log('got from file')
    },
    loggedIn:function(){
      return !this.isNew();
    },
    logout:function(){
      window.localStorage.clear();
      hls.user = new hls.UserModel();
      app.welcome();
    },
    saveToFile:function(){
      if(this.loggedIn()){
        var attributes = {user:this.attributes};
        //rewrite the user's car attribute to make sure it's the latest
        attributes.user.cars = _.map(this.cars.models, function(car){ return car.attributes; });
        attributes.user.payments = _.map(this.payments.models, function(payment){ return payment.attributes; });
        window.localStorage.setItem(this.getFileKey(), JSON.stringify(attributes));
        console.log('wrote to file');
      }
    },
    shouldSync:function(){
      if(!this.loggedIn()){
        return false;
      }
      return this.get('last_synced_at') != (new Date()).yyyymmdd();
    },
    update:function(data){
      this.set(data.user);
      this.cars.set(data.user.cars, {remove:false}); //this will download all cars and merge with temporary 
      this.payments.set(data.user.payments);
      this.saveToFile();
    },

});
