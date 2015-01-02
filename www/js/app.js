
$.support.cors = true;
hls.View = Backbone.View.extend({
    // postUrl:function(url, options){
    //   var options = options;
    //   options || (options = {});
    //   var success = options.success;
    //   if (hls.user.loggedIn()){ 
    //     options.data = hls.util.addAccessToken(options.data)
    //   }
     
    //   $.ajax({
    //     dataType: "json",
    //     url: url,
    //     data:options.data,
    //     type:"POST",
        
    //   });
    // },
    getUrl:function(url, options){
      var options = options;
      options || (options = {});
      var success = options.success;
      if (hls.user.loggedIn()){ 
        options.data = hls.util.addAccessToken(options.data)
      }
      $.mobile.loading( 'show', {text: '', textVisible: true, theme: 'z', html: ""}); //show jquery mobile spinner
      $.ajax({
        dataType: "jsonp",
        url: url,
        data:options.data,
        //type:options.type, //JSONP always GET!
        success:function(data){
          $.mobile.loading('hide'); //hide jquery mobile spinner
          console.log("Got data:",data);
          if(data.car){
            hls.user.cars.set([data.car], {remove:false});
            hls.user.saveToFile();
          }
          if(success){ 
            success(data); 
          }
        },
        error:function(error){
          console.log('error');
        },
        
      });
    },
    render:function (eventName) { //default render uses default template
        var template = _.template($(this.template).html());
        $(this.el).html(template);
        return this;
    },
    //generalized form submitting & validation method.
    //Define onFormSubmit for when it succeeds.
    submitForm:function(form, onFormSubmit){
      var data = form.serialize();
      var success = onFormSubmit;
      this.getUrl(form.attr('action'),{
        data:data,
        success:function(data){
            if(data.errors){
              alert(data.errors);
            } else {
              success(data);
            }
        }
      });
    },
    //The normal render function will not include the jQuery mobile styling 
    //so use this specific callback instead of render()
    _render:function(){
         this.render(); //redraw HTML template
         var menuTemplate = _.template($("#menu").html());
         $(this.el).find("div[data-role=header]").prepend(menuTemplate);
         $(this.el).trigger("create"); //trigger Jquery Mobile styling
    },
    onRemove:function(){
    },
});


hls.CarListView = hls.View.extend({
    events: {
      'click .split-view-button':'_showCar',
    },
    initialize:function(){
      this.splitView = null;
      $(window).bind('orientationchange', this._orientationHandler);
      $(window).bind('throttledresize', this._orientationHandler);
      return this;
    },
    showCar:function(carId){
      var car = hls.user.cars.get(carId);
      var page = new hls.CarView({model:car});
      //render the carpage in memory before appending it
      page.render();
      $(this.el).find(".ui-block-b").html("").append($(page.el));
      
      //highlight the car in the list
      $('.ui-block-a a').css("background-color", "none");
      $('a[data-car-id='+carId+']').css("background-color","white"); 
      $(this.el).trigger("create");
    },
    onRemove:function(){
      $(window).unbind('throttledresize');
      $(window).unbind('orientationchange');
    },
    render:function (eventName) {
      var splitView = hls.util.shouldSplitView({}); //returns true if split-screen
      var template = _.template($('#carlist').html(),{user:hls.user, splitView:splitView});
      $(this.el).html(template);
      this.splitView = splitView; //save it so we know when to rerender
      return this;
    },
    _orientationHandler:function(event){
       var page = app.currentPage;
      if (hls.util.shouldSplitView(event) != page.splitView){
        page._render(); //change splitview dynamically
      }

    },
    _showCar:function(e){
      //only used in splitView. Find the car we clicked on and show it
      var carId = $(e.target).attr("data-car-id");
      this.showCar(carId);
    },
});

hls.CarView = hls.View.extend({
    events: {
      'click #print_button_container':'_print',
    },
    render:function (eventName) {
      var template = _.template($('#car').html(),{car:this.model});
      $(this.el).html(template);
      return this;
    },
    _print:function(e){
      console.log('in print');
      window.open(this.model.pdfLink, '_system', 'location=yes');

    },
});

hls.DmsView = hls.View.extend({
    template:"#dms",
});

hls.EditCarView = hls.View.extend({
    template:"#edit-car",
    events: {
      'click #take-picture': '_takePicture',
    },
    render:function (eventName) { 
        var template = _.template($(this.template).html(), {car:this.model});
        $(this.el).html(template);
        return this;
    },
    _takePicture:function(){
      hls.camera.takePicture({});
      //Note: passing "success" option doesn't work on device
    },
});

hls.EditOptionsView = hls.View.extend({
    template:"#edit-options",
    events: {
      'click label': '_save',
      'touchstart label': '_save',
    },
    render:function (eventName) {
      var template = _.template($(this.template).html(),{car:this.model});
      $(this.el).html(template);
      return this;
    },
    _save:function(e){

      var label = $(e.currentTarget);
      var optionId = label.closest("li").attr('data-option');
      var installed = !label.closest("div").find("input").is(':checked'); //This is reversed; probably because of Jquery Mobile clicking delays
      this.model.installOption(optionId, installed);

    },


});

hls.LoginView = hls.View.extend({
    template:"#login",
    events: {
      'submit form': '_login',
    },
    _login:function(e){
        this.submitForm($(e.currentTarget), function(data){
            hls.user.set(data.user);
            hls.user.cars.set(data.user.cars, {remove:false}); //this will download all cars and merge with temporary cars
            //TODO: upload temp cars in memory
            hls.user.saveToFile();
            app.navigate("cars/list", true); 
        });
        return false;
    },
});

hls.SelectView = hls.View.extend({

    initialize:function(){
      var car = this.model;
      this.array = []; //this will hold the list of options to choose from
      if (_.isNull(car.get('year'))) {
        for(var i=new Date().getFullYear(); i > 1980; i--){
          this.array.push([i+"",""])
        }
      } 
      this.url = "#select/"
      if(car.get('year')) {this.url = this.url +car.get("year") + "/"}
      if(car.get('make')) {this.url = this.url +car.get("make_id") + "/"+car.get('make')+"/"}
      if(car.get('model')) {this.url = this.url +car.get("model_id") + "/"+car.get('model')+"/"}
      return this;
    },
    render:function (eventName) {
        var template = _.template($('#selector').html(), {array: this.array, url : this.url, car:this.model});
        $(this.el).html(template);

        
        if(this.model.get('style_id')){
          //we are done selecting, so load the car
          this.getUrl(hls.server+"/cars/vin",{
            data:{car:this.model.toParam()},
            success:function(data){
                if(data.errors){
                  alert(data.errors);
                } else if(data.car){ //car data is automatically synced in getURL 
                  app.navigate(hls.user.cars.get(data.car.id).showLink, true);
                  //redirect to car page!!
                }
            }
          });

        } else if(_.isEmpty(this.array)){
          //load the options array
          var selectView = this;
          this.getUrl(hls.server+"/cars/chrome_select",{
            data:this.model.toParam(),
            success:function(data){
                if(data.errors){
                  alert(data.errors);
                } else {
                  selectView.array = data;
                  selectView._render(); //redraw HTML template
                }
            }
          });
      }
        return this;
    },

});

hls.SignupView = hls.View.extend({
    template:"#signup",
    events: {
      'submit form': '_signup',
    },
    _signup:function(e){
        this.submitForm($(e.currentTarget), function(data){
            hls.user.set(data.user);
            hls.user.saveToFile();
            app.navigate("cars/list", true); 
        });
        return false;
    },
});

hls.SingleCarView = hls.View.extend({
  render:function(e){
    var template = _.template($('#car-holder').html(),{car:this.model});
    $(this.el).html(template);
    var carView = new hls.CarView({model:this.model});
    carView.render();
    $(this.el).find("#content").append($(carView.el));

  },
});

hls.VinView = hls.View.extend({
    template:"#vin",
    events: {
      'submit form': '_createCar',      
    },  
    _createCar:function(e){
      var form = $(e.currentTarget);
       this.submitForm(form, function(data){
         if(data && data.car){
         //car data is automatically synced in getURL 
          app.navigate(hls.user.cars.get(data.car.id).showLink, true);
          //redirect to car page!!
         }
       });
       return false;
    },
});


hls.WelcomeView = hls.View.extend({
    template:"#welcome",
    events: {
      'click .scan-vin': '_scan',
      'click #brightness-up': '_brightnessUp',
      'click #brightness-down': '_brightnessDown',
      'click #check-brightness':'_brightnessCheck',
    },
    _scan:function(){
      hls.camera.scanVin({success:function(vin){ 
        //on successful vin scan...
        app.navigate("#vin",{trigger:true}); //go to manual vin entry page
        $("#car_vin").val(vin); //fill in the vin
        $("#vin-form").submit();
      } });
    },
    scanSuccess:function(vin){
        app.navigate("#vin",{trigger:true}); //go to manual vin entry page
        $("#car_vin").val(vin); //fill in the vin
        $("#vin-form").submit();
    },
    /* Brightness Change only works when the phone's brightness is set to Auto!*/
    _brightnessCheck:function(){
      console.log('in brightness check');
      if(!hls.emulated){
        window.brightness = cordova.require("cordova.plugin.Brightness.Brightness");
        brightness.getBrightness( function(i){ alert('Brightness: ' + i);}, this.dummy);
        
      }
    },
    _brightnessUp:function(){
      console.log('in brightness up');
      if(!hls.emulated){
        window.brightness = cordova.require("cordova.plugin.Brightness.Brightness");
        brightness.setBrightness(100, this.dummy, this.dummy);
        
      }
    },
    _brightnessDown:function(){
      console.log('in brightness down');
      if(!hls.emulated){
        window.brightness = cordova.require("cordova.plugin.Brightness.Brightness");
        brightness.setBrightness(0, this.dummy, this.dummy);
      }
    },
    dummy:function(status){
    },

});

hls.AppRouter = Backbone.Router.extend({
    routes:{
        "":"welcome",
        "login":"login",
        "logout":"logout",
        "vin":"vin",
        "cars/list":"carsList",
         "cars/:id":"cars",
         "cars/:id/edit":"editCar",
         "dms":"dms",
         "select":"selectYear",
         "select/:year/":"selectMake",
         "select/:year/:make_id/:make":"selectModel",
         "select/:year/:make_id/:make/:model_id/:model":"selectStyle",
         "select/:year/:make_id/:make/:model_id/:model/:style_id/:style":"selectCar",
         "signup":"signup",
         "cars/:id/edit/options":"editOptions",

    },
    initialize:function () {
        // Handle back button img throughout the application
        $('a.back').live('click', function(event) {
            app.goBack();
            return false;
        });
        $("a.menubutton").live('click',function(e){
          $(".slicknav_hidden").toggle(); //show/hide the menu
        });
        this.currentPage = null;
    },

    dms:function () {
      this.changePage(new hls.DmsView());
    },
    login:function () {
      this.changePage(new hls.LoginView());
    },
    logout:function(){
      hls.user.logout();
    },
    carsList:function(){
      if(this.checkLoggedIn()){
        this.changePage(new hls.CarListView());
      }
    },


    cars:function(id) {
      if(this.carExists(id)){
        var car = hls.user.cars.get(id); //find car in carlist

        if(hls.util.shouldSplitView()){
          //tablet view
          this.changePage(new hls.CarListView());
          this.currentPage.showCar(id);

        } else {
          //phone view
          this.changePage(new hls.SingleCarView({model:car}));
        }
      }
    },
    editCar:function(id){
        if(this.carExists(id)){
          var car = hls.user.cars.get(id);
          this.changePage(new hls.EditCarView({model:car}));
        }
    },    
    editOptions:function(id){
      if(this.carExists(id)){
        var car = hls.user.cars.get(id);
        this.changePage(new hls.EditOptionsView({model:car}));
      }
    },


    selectYear:function(){
      this.changePage(new hls.SelectView({model:new hls.Car()}));
    },
    selectMake:function(year){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year})}));
    },
    selectModel:function(year, make_id, make){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year, make_id:make_id, make:make})}));
    },
    selectStyle:function(year, make_id, make, model_id, model){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year, make_id:make_id, make:make, model_id: model_id, model:model})}));
    },
    selectCar:function(year, make_id, make, model_id, model, style_id, style){
      //we don't need make-id and model-id to create a car
      this.changePage(new hls.SelectView({model:new hls.Car({year:year, make:make, model:model, style_id:style_id})}));     
    },
    signup:function () {
      this.changePage(new hls.SignupView());
    },
    vin:function(){
      this.changePage(new hls.VinView({}));
    },
    welcome:function () {
        this.changePage(new hls.WelcomeView());
        
    },
    //helper methods
    changePage:function (page) {
        //render the page
        $(page.el).attr('data-role', 'page');
        page._render();
        //append to page and finish up
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
        if(this.currentPage){ 
          this.currentPage.onRemove();
          this.currentPage.remove(); 
        }
        this.currentPage = page;
    },
    carExists:function(id){
        var car = hls.user.cars.get(id); //find car in carlist
        //if it's not found, they need to login
        if(_.isUndefined(car)){ 
          app.navigate("login", true);
          return false;
        } 
      return true;
    },    
    checkLoggedIn:function(){
      if(hls.user.loggedIn()){ return true; }
      app.navigate("login", true);
      return false;
    },
    goBack:function(){
      if(window.location.hash != ""){
         window.history.back();
      } else {
        this.exit();
      }
    },

});


$(document).ready(function () {
    hls.user = new hls.UserModel();

    hls.camera = new hls.Camera();
    app = new hls.AppRouter();
    Backbone.history.start();
    //set the phone's backbutton so it always goes to the previous page
    document.addEventListener( "backbutton", function(){ app.goBack(); }, false );
    //make the menu button open the menu
    document.addEventListener("menubutton", function(){ $(".slicknav_hidden").toggle(); }, false);


});
document.addEventListener('deviceready', function(){ hls.user.loadFromFile(); } , false);

