function ajax_upload(url,data,filename,uploadreturn) {

	// prepare the MIME POST data
	var boundaryString = 'fritterboyfgfd4545645';
	var boundary = '--' + boundaryString;
	var nl = "\r\n";
	
	var requestbody = '--'+boundary + nl 
	+ 'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n' 
	+ 'Content-Type: text/html' + nl 
	+ nl
	+ data
	+ nl
	+ "--"+boundary+"--";

	var random = randomString();
	$.ajax({
		url: url+"&sec="+random,
		type: "POST",
		data: requestbody,
		processData: false,
		dataType: "json", 
		contentType:"multipart/form-data; boundary=" + boundary + "",
		error: function(request, textStatus, errorThrown){
			alert(errorThrown);
		},
		success: function(data,textStatus){
			$.ajax({
				url: url+"&sec="+random,
				type: "GET",
				dataType: "jsonp", 
				error: function(request, textStatus, errorThrown){
					alert(errorThrown);
				},
				success: function(data,textStatus){
					uploadreturn(data);
				}
	  	    });
		}	  		
	});
}

function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

var generatedMetadata = "";
function doStuff(data)
{
    document.getElementById('loading').style.display = "none";
    document.getElementById('content').style.display = "block";
    $(".errormsg").html(data.error);
    toggle(data);
    if (data.title != null && data.mimetype == "application/pdf")
        $(".titlex").html(data.title);
    else
        chrome.windows.getCurrent(function(window){
            chrome.tabs.getSelected(window.id, function(tab) {
                $(".titlex").html(tab.title);
            });
        });
    $(".description").html(data.description);
    $(".identifier").html(data.identifier);
         if (data.subject != null)             
      $(".keywords").html(data.subject.toString().replace(new RegExp(",","g"),", "));
    if (data.classification != null)
      $(".classification").html(formatClass(data.classification.toString()).replace(",",", "));
    $(".language").html(getlanguage(data.language));
    $(".readinglevel").html(formatGradeLevel(data.readinglevel));
    $(".readingtime").html(formatReadingTime(data.readingtime));
    $(".pages").html(formatPages(data.pages));
    $(".wordcount").html(data.wordcount);
    $(".uniquewordcount").html(data.uniquewordcount);
    $(".sentencecount").html(data.sentencecount);
    $(".averagewordlength").html(Math.round(data.averagewordlength*10)/10);
    $(".syllablecount").html(data.syllablecount);
	generatedMetadata = data;
}

var counter = 0;
var sumOfHtml = null;

chrome.extension.onRequest.addListener(function(response,sender,sendRequest){
    if (response.app == "chromeglance")
        if (response.action == "XcountMe")
        {
			counter = counter + 1;
        }
        else if (response.action == "XgetMeData")
        {
			if (response.data != null)
			{
				if (sumOfHtml == null)
					sumOfHtml = "";
                sumOfHtml = sumOfHtml + response.data;
            }
        }
        else if (response.action == "Xgo")
        {
            if (--counter == 0) 
            {
				current_url = response.url;
                if (sumOfHtml != null)  
                    ajax_upload("http://sphinx.eduworks.com/learningregistry/getMetadata?url="+response.url,sumOfHtml,"blah.html",function(data){
                        doStuff(data);
                    });
                else
                    alert("File types other than HTML not currently supported.");
            }
        }
});
var current_url;

function sign(data)
{
	var bencoded = bencode(data);
	var hashed = sha256_digest(bencoded);
	var hash = prompt("Please use your private key to sign the following data: '" + hashed + "'",hashed);
	
	return hash;
}
function fetchEnvelope()
{
	var useSigned = confirm("Please click OK if you would like to use a signed request. You will be required to have a PGP Private key.");
	if (useSigned)
		return {
			doc_type: "resource_data", 
			resource_data: generatedMetadata,
			digital_signature: {
				signature: sign(generatedMetadata),
				key_owner: prompt("Please insert the PGP Key Owner name."),
				key_location: prompt("Please insert the URL of the third party who has signed your key.","http://keyserver.pgp.com"),
				signing_method: "LR-PGP.1.0"
			},
			keys: ["metadata","Eduworks","generated","Metaglance"], 
			resource_data_type: "metadata", 
			payload_placement: "inline", 
			payload_schema: ["dc"], 
			doc_version: "0.23.0", 
			active: true,
			publishing_node: "local",
			resource_locator: current_url, 
			identity: {
				owner: "metaglance.com", 
				submitter: "LearningRegistrar", 
				submitter_type: "agent", 
				curator: "metaglance.com"
				}
			};
		else
			return {
			doc_type: "resource_data", 
			resource_data: generatedMetadata, 
			keys: ["metadata","Eduworks","generated","Metaglance"], 
			resource_data_type: "metadata", 
			payload_placement: "inline", 
			payload_schema: ["dc"], 
			doc_version: "0.23.0", 
			active: true,
			publishing_node: "local",
			resource_locator: current_url, 
			identity: {
				owner: "metaglance.com", 
				submitter: "LearningRegistrar", 
				submitter_type: "agent", 
				curator: "metaglance.com",
				signer: "http://keyserver.pgp.com"
				}
			};
}
function toLearningRegistry()
{
	var result = fetchEnvelope();
	$.ajax({
		url: "http://lrdev01.learningregistry.org/publish",
		type: "POST",
		data: JSON.stringify({documents:[result]}),
		contentType: "application/json",
		success: function(data){
			chrome.tabs.create({url:"http://lrdev01.learningregistry.org/obtain?request_id="+data.document_results[0].doc_ID+"&by_doc_ID=t"});
		}
    });
}

function keyCheck()
{
     var response = confirm('This plugin uses MetaGlance, an Eduworks automated metadata generation web service. By clicking OK, you agree that the use of this service is for non-commercial purposes, and that the results of the generation are property of Eduworks, licensed for open use under an attribution license, which shall be submitted as part of the Learning Registry envelope.');

     if (response)
        chrome.windows.getCurrent(function(window){
            chrome.tabs.getSelected(window.id, function(tab) {
                chrome.tabs.sendRequest(tab.id, {action: "countMe",app:"chromeglance"});
                chrome.tabs.sendRequest(tab.id, {action: "getMeData",app:"chromeglance"});
                chrome.tabs.sendRequest(tab.id, {action: "go",url:tab.url,app:"chromeglance"});
                $(".titlex").html(tab.title);
            });
        });
	else
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.update(tab.id, { selected: true } )
		});
}
function goToMetaglance()
{
    chrome.tabs.create({url:"http://www.metaglance.com"});
}
function goToEduworks()
{
    chrome.tabs.create({url:"http://www.eduworks.com"});
}