
$.support.cors = true;
hls.View = Backbone.View.extend({

    getUrl:function(url, options){
      var options = options;
      options || (options = {});
      var success = options.success;
      // if (hls.user.loggedIn()){ //TODO test adding cars after you're logged in
      //   options.data = hls.util.addAccessToken(options.data)
      // }
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
          }
          if(success){ 
            success(data); 
          }
        },
        
      });
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
         $(this.el).trigger("create"); //trigger Jquery Mobile styling
    },
    onRemove:function(){
    },
});

hls.CarView = hls.View.extend({
    render:function (eventName) {
        //logged-in view
      var template = _.template($('#car').html(),{car:this.model});
      $(this.el).html(template);
      //Cloudprint stuff
      var gadget = new cloudprint.Gadget();
      gadget.setPrintButton($(this.el).find("#print_button_container")[0]); // div id to contain the button
      gadget.setPrintDocument("url", "Window Sticker", "https://www.google.com/landing/cloudprint/testpage.pdf");
      return this;
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
      page.render();
      $(this.el).find(".ui-block-b").html("").append($(page.el).find("#content").html());
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
      var carId = $(e.target).attr("data-car-id");
      this.showCar(carId);
    },
});

hls.LoginView = hls.View.extend({
    events: {
      'submit form': '_login',
    },
    render:function (eventName) {
        var template = _.template($('#login').html());
        $(this.el).html(template);
        return this;
    },
    _login:function(e){
        this.submitForm($(e.currentTarget), function(data){
            hls.user.set(data.user);
            hls.user.cars.set(data.user.cars, {remove:false}); //this will download all cars and merge with temporary cars
            //we don't need to upload temp cars since that happens as they're created
            hls.user.file.saveUser();
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
        var template = _.template($('#selector').html(), {array: this.array, url : this.url});
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

hls.VinView = hls.View.extend({
    events: {
      'submit form': '_createCar',      
    },  
    render:function (eventName) {
        var template = _.template($('#vin').html())
        $(this.el).html(template);
        return this;
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
    events: {
      'click .scan-vin': '_scan',
    },
   
    render:function (eventName) {
        var template = _.template($('#welcome').html())
        $(this.el).html(template);
        return this;
    },
    _scan:function(){
      hls.camera.scanVin({success:function(vin){ 
        //on successful vin scan...
        app.navigate("#vin",{trigger:true}); //go to manual vin entry page
        $("#car_vin").val(vin); //fill in the vin
        $("#vin-form").submit();
      } });
    },

});

hls.AppRouter = Backbone.Router.extend({
    routes:{
        "":"welcome",
        "login":"login",
        "vin":"vin",
        "cars/list":"carsList",
         "cars/:id":"cars",
         "select":"selectYear",
         "select/:year/":"selectMake",
         "select/:year/:make_id/:make":"selectModel",
         "select/:year/:make_id/:make/:model_id/:model":"selectStyle",
         "select/:year/:make_id/:make/:model_id/:model/:style_id/:style":"selectCar",
         "exit":"exit",

    },
    initialize:function () {
        // Handle back button img throughout the application
        $('.back').live('click', function(event) {
            if(window.history.length > 1){
              window.history.back();
            } else {
              navigator.app.exitApp();
            }
            return false;
        });
        $(".menubutton").live('click',function(e){
          $(".slicknav_hidden").toggle(); //show/hide the menu
        });
        this.currentPage = null;
    },

    login:function () {
      this.changePage(new hls.LoginView());
        
    },
    carsList:function(){
      if(this.checkLoggedIn()){
        this.changePage(new hls.CarListView());
      }
    },


    cars:function(id) {
        var car = hls.user.cars.get(id); //find car in carlist

        //if it's not found, they need to login
        if(_.isUndefined(car)){ 
          this.changePage(new hls.LoginView());
          return;
        } 
        //TODO test this!
        if(hls.util.shouldSplitView()){
          //tablet view
          this.changePage(new hls.CarListView());
          this.currentPage.showCar(id);

        } else {
          //phone view
          this.changePage(new hls.CarView({model:car}));
        }
    },
    exit:function(){
      navigator.app.exitApp();
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
    vin:function(){
      this.changePage(new hls.VinView({}));
    },
    welcome:function () {
        this.changePage(new hls.WelcomeView());
        
    },
    changePage:function (page) {
        //render the page
        $(page.el).attr('data-role', 'page');
        page.render();
        //copy menu button template
        var menuTemplate = _.template($("#menu").html());
        $(page.el).find("div[data-role=header]").prepend(menuTemplate);
        //append to page and finish up
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
        if(this.currentPage){ 
          this.currentPage.onRemove();
          this.currentPage.remove(); 
        }
        this.currentPage = page;
    },
    checkLoggedIn:function(){
      if(hls.user.loggedIn()){ return true; }
      this.changePage(new hls.LoginView());
      return false;
    }

});

$(document).ready(function () {
    hls.user = new hls.UserModel();
    hls.user.file.loadUser();
    hls.camera = new hls.Camera();
    app = new hls.AppRouter();
    Backbone.history.start();
    //set the phone's backbutton so it always goes to the previous page
    document.addEventListener( "backbutton", function(){ window.history.back(); }, false );
    //make the menu button open the menu
    document.addEventListener("menubutton", function(){ $(".slicknav_hidden").toggle(); }, false);

});


