(function() {  // create a closure

  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEWrMPRWhmDtWskMTVFr1uGVIjPIockS3H8QW3ondGrJrokhmG/exec";

  var msg_sent_alert = $('#message-sent-alert');
  var msg_sending_alert = $('#message-sending-alert');
  var msg_error_alert = $('#message-error-alert');

  function validEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  }

  // get all data in form and return object
  function consolidateFormData(form) {
    var elements = form.elements;

    console.log("elements",elements);

    var allFieldsPromise = [];

    // Filter out only field with name
    var fields = Object.keys(elements)
      .map(function(k) {
        if(elements[k].name !== undefined) {
          return elements[k].name;
        }
        // special case for Edge's html collection
        else if(elements[k].length > 0) {
          console.log("handling special case");
          return elements[k].item(0).name;
        }
      })
      // filter out the null element after the map above
      .filter(function(item, pos, self) {
        return self.indexOf(item) == pos && item;
      });

    var formData = {};
    fields.forEach(function(name) {
      allFieldsPromise.push(new Promise(
        (resolve, reject) => {
          processField(elements[name])
            .then((val) => {
              formData[name] = val;
              resolve();
            })
            .catch((e) => {
              // TODO handle error
              // Unable to process this field.
              console.log(e);
              reject();
            });
        }));
    });

    return new Promise(
      (resolve, reject) => {
        Promise.all(allFieldsPromise)
          .then(() => {
            formData.formDataNameOrder = JSON.stringify(fields);
            resolve(formData);
          })
          .catch((e) => {
            reject();
          });
      });
  }

  // supports
  //  * single file field
  //  * text field
  function processField(element) {
    // check file
    return new Promise(
      (resolve, reject) => {
        if (element.type && element.type === "file" && element.files.length > 0) {
          var reader = new FileReader();
          reader.onloadend = (e) => {
            if (e.target.error == null) {
              resolve(e.target.result);
            } else {
              reject("fail to open file");
            }
          };
          reader.readAsDataURL(element.files[0]);
        } else if (element.type && element.type === "select-multiple") {
          var list = "";
          for (var i = 0; i < element.selectedOptions.length; i++) {
            list += element.selectedOptions.item(i).value;
            if (i < element.selectedOptions.length-1) {
              list += ", ";
            }
          }
          console.log(list);
          resolve(list);
        } else {
          resolve(element.value);
        }
      });
  }

  function handleFormSubmission(event) {  // handles form submit without any jquery
    event.preventDefault();           // we are submitting via xhr below

    consolidateFormData(event.target)         // get the values submitted in the form
      .then((data) => {
        // console.log(data);

        // use xhr to send out the form
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            // console.log(xhr.readyState, xhr.statusText);
            // console.log(xhr.responseText);
            if (xhr.readyState == 1) {
              msg_sent_alert.hide();
              msg_error_alert.hide();
              msg_sending_alert.slideDown("400");
            } else if (xhr.readyState == 4 && xhr.status == 200) {
              msg_sending_alert.hide();
              msg_error_alert.hide();
              msg_sent_alert.slideDown("400");
              $('#form-submit-btn').attr("disabled", true); // prevent user from resubmitting the form.
            } else if (xhr.readyState == 4 && xhr.status != 200) {
              msg_sending_alert.hide();
              msg_sent_alert.hide();
              msg_error_alert.slideDown("400");
            }
        };
        xhr.open('POST', GOOGLE_SCRIPT_URL);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        // xhr.withCredentials = true;
        // url encode form data for sending as post data
        var encoded = Object.keys(data).map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        // console.log("encoded: ", encoded);
        xhr.send(encoded);
      });
  }



  function loaded() {
    // console.log("Contact form submission handler loaded successfully.");
    // bind to the submit event of our form
    var forms = document.querySelectorAll("form.gform");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmission, false);
    }

    msg_sent_alert.removeClass("sr-only");
    msg_sending_alert.removeClass("sr-only");
    msg_error_alert.removeClass("sr-only");
    msg_sent_alert.hide();
    msg_sending_alert.hide();
    msg_error_alert.hide();
  };
  document.addEventListener("DOMContentLoaded", loaded, false);

  // function disableAllButtons(form) {
  //   var buttons = form.querySelectorAll("button");
  //   for (var i = 0; i < buttons.length; i++) {
  //     buttons[i].disabled = true;
  //   }
  // }
})();
