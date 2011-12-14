/*
 * Copyright 2002-2011 Eduworks
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 * More information about this project is available at:
 *
 *    https://github.com/Lomilar/LearningRegistrar
 */

function buildActor()
{
	if (!confirm("Press OK if you wish to include the actor.")) return null;
	var resultantActor = {
		objectType: prompt("What is the actor? (Teacher, Student, etc)")
	};
	var description = "temp";
	if (confirm("Press OK if you wish to include a description."))
	{
		while (description != null && description.length > 0)
		{
			description = prompt("Please enter a short descriptor (one or two words) of the actor. Empty to exit.");
			if (description != null && description.length > 0)
			{
				if (resultantActor.description == null)
				{
					resultantActor.description = [];
				}
				resultantActor.description.push(description);
			}
		}
	}
	return resultantActor;
}

function assembleParadataViewed()
{
	var resultantParadata = {
		actor: buildActor(),
		verb: {
			action: "viewed",
			date: (new Date().getMonth()+1)+"-"+new Date().getDate()+"-"+new Date().getFullYear()
		},
		object: {
			id: currentUrl
		}
	};
	return resultantParadata;
}