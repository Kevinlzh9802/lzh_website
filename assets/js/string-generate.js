"use strict";
$(function () { // Same as document.addEventListener("DOMContentLoaded"...
  
  const UPPERCASESET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWERCASESET = "abcdefghijklmnopqrstuvwxyz";
  const NUMBERSET = "0123456789";
  const OTHERCHARSET = "`~!@#$%^&*(){}[]-=_+\\|;:\'\",./<>?";

  var eligibleOptions = ["upperCaseLetter", "lowerCaseLetter", "numbers", "otherCharacters"];
  for (let index = 0; index < eligibleOptions.length; index++) {
    const eligibleOptionName = eligibleOptions[index];
    $("#" + eligibleOptionName).change(function (event) {
      if ($("#" + eligibleOptionName).is(":checked") == false) {
        // if not eligible, then obviously not eligible for first character
        // uncheck then disable
        $("#" + eligibleOptionName + "1").attr("checked", null);
        $("#" + eligibleOptionName + "1").attr("disabled", "disabled");
      } 
      else {
        $("#" + eligibleOptionName + "1").attr("disabled", null);
      }
    });
  }

  // check which option is selected and disable the length options of the other one
  $("#fixedLength").change(function (event) {
    if ($("#fixedLength").is(":checked") == true) {
      $("#setFixedLength").attr("disabled", null);
      $("#randomMinLength").attr("disabled", "disabled");
      $("#randomMaxLength").attr("disabled", "disabled");
      $("#randomMinLength").removeClass("is-invalid");
      $("#randomMaxLength").removeClass("is-invalid");
    };
  });

  $("#randomLength").change(function (event) {
    if ($("#randomLength").is(":checked") == true) {
      $("#setFixedLength").attr("disabled", "disabled");
      $("#setFixedLength").removeClass("is-invalid");
      $("#randomMinLength").attr("disabled", null);
      $("#randomMaxLength").attr("disabled", null);
    };
  });
  
  // check whether the input is valid
  var inputValid = false;
  var lengthFixed = null;
  var stringLength = null;
  var lengthLowerBound = null;
  var lengthUpperBound = null;
  $("#stringGeneratorForm").submit(function (event) {
    if ($("#fixedLength").is(":checked") == true) {
      var stringLengthTemp = Number($("#setFixedLength").val());
      if (stringLengthTemp >= 1 && stringLengthTemp <= 30 && Number.isInteger(stringLengthTemp)) {
        $("#setFixedLength").removeClass("is-invalid");
        stringLength = stringLengthTemp;
        inputValid = true;
        lengthFixed = true;
      } else {
        $("#setFixedLength").addClass("is-invalid");
        event.preventDefault();
        stringLength = null;
        return;
      };
    } else if ($("#randomLength").is(":checked") == true) {
      lengthLowerBound = Number($("#randomMinLength").val());
      lengthUpperBound = Number($("#randomMaxLength").val());
      var input1Valid = false;
      var input2Valid = false;

      if (lengthLowerBound >= 1 && lengthLowerBound <= 30 && Number.isInteger(lengthLowerBound)) {
        $("#randomMinLength").removeClass("is-invalid");
        input1Valid = true;
      } else {
        $("#randomMinLength").addClass("is-invalid");
        // event.preventDefault();
        // return;
      };

      if (lengthUpperBound >= 1 && lengthUpperBound <= 30 && Number.isInteger(lengthUpperBound)) {
        $("#randomMaxLength").removeClass("is-invalid");
        input2Valid = true;
      } else {
        $("#randomMaxLength").addClass("is-invalid");
        // event.preventDefault();
      };

      if (input1Valid == true && input2Valid == true) {
        if (lengthLowerBound > lengthUpperBound) {
          $("#randomMinLength").addClass("is-invalid");
          $("#randomMaxLength").addClass("is-invalid");
          event.preventDefault();
          // return;
        } else {
          inputValid = true;
          lengthFixed = false;
        };
      }
    };

    var charset = "";
    var firstCharset = "";
    var charsetValid = false;
    var firstCharsetValid = false;

    charset += ($("#upperCaseLetter").is(":checked") ? UPPERCASESET : "");
    charset += ($("#lowerCaseLetter").is(":checked") ? LOWERCASESET : "");
    charset += ($("#numbers").is(":checked") ? NUMBERSET : "");
    charset += ($("#otherCharacters").is(":checked") ? OTHERCHARSET : "");
    
    firstCharset += ($("#upperCaseLetter1").is(":checked") ? UPPERCASESET : "");
    firstCharset += ($("#lowerCaseLetter1").is(":checked") ? LOWERCASESET : "");
    firstCharset += ($("#numbers1").is(":checked") ? NUMBERSET : "");
    firstCharset += ($("#otherCharacters1").is(":checked") ? OTHERCHARSET : "");

    // check the charset options are not empty
    if (charset == "") {
      $("#upperCaseLetter").addClass("is-invalid");
      $("#lowerCaseLetter").addClass("is-invalid");
      $("#numbers").addClass("is-invalid");
      $("#otherCharacters").addClass("is-invalid");
    } else {
      $("#upperCaseLetter").removeClass("is-invalid");
      $("#lowerCaseLetter").removeClass("is-invalid");
      $("#numbers").removeClass("is-invalid");
      $("#otherCharacters").removeClass("is-invalid");
      charsetValid = true;
    }

    if (firstCharset == "") {
      $("#upperCaseLetter1").addClass("is-invalid");
      $("#lowerCaseLetter1").addClass("is-invalid");
      $("#numbers1").addClass("is-invalid");
      $("#otherCharacters1").addClass("is-invalid");
    } else {
      $("#upperCaseLetter1").removeClass("is-invalid");
      $("#lowerCaseLetter1").removeClass("is-invalid");
      $("#numbers1").removeClass("is-invalid");
      $("#otherCharacters1").removeClass("is-invalid");
      firstCharsetValid = true;
    }

    // start generating if all requirements are satisfied
    if (lengthFixed != null && charsetValid == true && firstCharsetValid == true) {
      var resultGroup = [];
      var stringAmount = Number($("#generateAmount").val());
      var showString = "";
      if (lengthFixed == true) {
        for (let amountIndex = 0; amountIndex < stringAmount; amountIndex++) {
          resultGroup.push(stringGenerator(stringLength, charset, firstCharset));
        }  
      } else {
        for (let amountIndex = 0; amountIndex < stringAmount; amountIndex++) {
          resultGroup.push(stringGenerator(getRandomIntInclusive(lengthLowerBound, lengthUpperBound), charset, firstCharset));
        }
      };

      // show all strings in textarea, each of which in a new line
      for (let showIndex = 0; showIndex < resultGroup.length; showIndex++) {
        showString += (resultGroup[showIndex] + "\n");
      }
      showString = showString.slice(0, showString.length-1);
      $("#generateResult").text(showString);
    } else {
      return;
    }
  });

  $("#copyAll").click(function (event) {
    $("#generateResult").select();
    document.execCommand("copy");
    $("#generateResult").blur();
  });
  
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive 
  }

  // generate a single string with fixed length
  function stringGenerator (length, charset, firstCharset) {
    var resultString = "";
    resultString += firstCharset.charAt(getRandomInt(0, firstCharset.length));
    if (length >= 2) {
      for (let lengthIndex = 1; lengthIndex < length; lengthIndex++) {
        resultString += charset.charAt(getRandomInt(0, charset.length));
      }
    }
    return resultString;
  }
});
