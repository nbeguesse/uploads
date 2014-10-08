
$.support.cors = true;
hls.View = Backbone.View.extend({

    getUrl:function(url, options){
      var options = options;
      options || (options = {});
      var success = options.success;
      // if (hls.user.loggedIn()){
      //   options.data = hls.util.addAccessToken(options.data)
      // }
      $.mobile.loading( 'show', {text: '', textVisible: true, theme: 'z', html: ""}); //show jquery mobile spinner
      $.ajax({
        dataType: "jsonp",
        url: url,
        data:options.data,
        type:options.type || "POST",
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
    // //call back for background form submission. Will throw away any results
    // _submit:function(e){
    //   var form = $(e.currentTarget);
    //    this.submitForm(form, function(data){
    //      console.log('Got data:',data); //success function
    //    });
    //   return false;
    // },
    //The normal render function will not include the jQuery mobile styling 
    //so use this specific callback instead of render()
    _render:function(){
         this.render(); //redraw HTML template
         $(this.el).trigger("create"); //trigger Jquery Mobile styling
    },
});

hls.CarView = hls.View.extend({
    render:function (eventName) {
        //logged-in view
        console.log('in carview render')
      var template = _.template($('#car').html(),{car:this.model});
      $(this.el).html(template);
      //Cloudprint stuff
      var gadget = new cloudprint.Gadget();
      gadget.setPrintButton($(this.el).find("#print_button_container")[0]); // div id to contain the button
      gadget.setPrintDocument("url", "Window Sticker", "https://www.google.com/landing/cloudprint/testpage.pdf");
      return this;
    },
});

hls.HomeView = hls.View.extend({
    render:function (eventName) {
      if(hls.user.loggedIn()){
        //logged-in view
        var template = _.template($('#user').html(),{user:hls.user});
        $(this.el).html(template);
      }
      return this;
    },
});

hls.SelectView = hls.View.extend({

    initialize:function(){
      var car = this.model
      this.array = [];
      if (_.isNull(car.get('year'))) {
        this.array = [["1994","1994"],["1995","1995"],["1996","1996"]];
      } 
      this.url = "#select/year/"
      if(!_.isNull(car.get('year'))) {this.url = this.url +car.get("year") + "/make/"}
      if(!_.isNull(car.get('make'))) {this.url = this.url +car.get("make") + "/model/"}
      if(!_.isNull(car.get('model'))) {this.url = this.url +car.get("model") + "/style/"}
      return this;
    },
    render:function (eventName) {
        var template = _.template($('#selector').html(), {array: this.array, url : this.url});
        $(this.el).html(template);
        if(_.isEmpty(this.array)){
          console.log('emptyArray');
          var selectView = this;
          this.getUrl(hls.server+"/cars/chrome_select",{
            data:{
              year:this.model.get('year'),
              make_id:this.model.get('make') || "",
              model_id:this.model.get('model') || ""
            },
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
      'submit form': '_login',
      'click .scan-vin': '_scan',
    },
    initialize:function(){
        return this;
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
    _login:function(e){
        this.submitForm($(e.currentTarget), function(data){
            hls.user.set(data.user);
            hls.user.cars.set(data.user.cars, {remove:false}); //this will download all cars and merge with temporary cars
            //we don't need to upload temp cars since that happens as they're created
            app.changePage(new hls.HomeView({model:hls.user})); 
        });
        return false;
    },
});

hls.AppRouter = Backbone.Router.extend({
    routes:{
        "":"welcome",
        "login":"welcome",
        "vin":"vin",
         "cars/:id":"cars",
         "select":"selectYear",
         "select/year/:year":"selectMake",
         "select/year/:year/make/:make":"selectModel",
         "select/year/:year/make/:make/model/:model":"selectStyle",

    },
    initialize:function () {
        // Handle back button img throughout the application
        $('.back').live('click', function(event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;
        this.currentPage = null;
    },

    login:function () {
      this.changePage(new hls.HomeView({model:hls.user}));
        
    },


    cars:function(id) {
        
        var car = hls.user.cars.get(id); //find car in carlist
        console.log('#cars', car);
        if(_.isUndefined(car)){ car = hls.user.get_curr_car();} //if it's not found, they need to login
        this.changePage(new hls.CarView({model:car}));
    },

    selectYear:function(){
      this.changePage(new hls.SelectView({model:new hls.Car()}));
    },
    selectMake:function(year){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year})}));
    },
    selectModel:function(year, make){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year, make:make})}));
    },
    selectStyle:function(year, make, model){
      this.changePage(new hls.SelectView({model:new hls.Car({year:year, make:make, model:model})}));
    },
    vin:function(){
      this.changePage(new hls.VinView({}));
    },
    welcome:function () {
        console.log('#welcome');
        this.changePage(new hls.WelcomeView());
        
    },
    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
        if(this.currentPage){ this.currentPage.remove(); }
        this.currentPage = page;
    }

});

$(document).ready(function () {
    hls.user = new hls.UserModel();
    hls.camera = new hls.Camera();
    app = new hls.AppRouter();
    Backbone.history.start();
    //set the phone's backbutton so it always goes to the previous page
    document.addEventListener( "backbutton", function(){ window.history.back(); }, false );
    document.addEventListener("menubutton", function(){ console.log('menu clicked'); }, false);
});

