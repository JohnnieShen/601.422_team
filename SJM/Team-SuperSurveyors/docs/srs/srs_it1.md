# SRS of Team SuperSurveyors
Larry Cai (larrythelog), Jianwei Chen (jchen362), Mia Jin (zhengyue4499), Noah Park (noahpark101), Xin Tan (tanx3036), Evelynn Zhang (jiayizhang-evelynn)

## Problem Statement
* For a lot of surveys that students conduct, there are a couple of problems associated with them. 
  * First, the participant selection is often subject to a bias of convenience because the survey only reaches people who are somewhat related to the individual who is conducting the survey. 
  * In addition, the survey itself may not get enough participants as its “advertisement” depends purely on the creator of the survey. 

## Potential Clients
* Anyone who needs participants for their survey are potential users for our software. The software is geared towards students at Hopkins and/or other universities who need answers for their surveys from random people. This can include people from within their university or those that match a specific set of interests that they can’t obtain through traditional methods (handing out surveys in person, online forms, etc.).

## Proposed Solution
* We will create a platform for people to submit their surveys for other people to fill out. 
  * In order for someone to submit their own survey, they need to answer 2-3 surveys themselves in order to gain a survey coin. In other words, you would gain survey coins from answering other people’s surveys which is used to purchase the right to submit your own surveys. For answering surveys, you are given a random survey to answer to make the participants for each survey random to reduce user bias. 
  * Our software will provide an incentive to answer surveys while promoting an environment for your own surveys to be answered by random/select people, fixing the convenience bias and lack of participants problem described earlier in this document.

## Functional Requirements
* Must-have features: 
  * As a user with a survey to share, I want to **be able to create a form** that includes different types of questions(MCQ, ranking, FRQ), so that I can get different types of answers.
  * As a user who wants to participate in a survey, I want the **survey to be easy to respond to**, so I can finish the survey efficiently.
  * As a user with a survey to share, I want to be able to **view data collected** from the survey, so that I review the data even after the survey is closed.
  * As a user with a survey to share/respond to a survey, I want the **survey to be randomly assigned**, so that you can make sure all surveys get enough response.
* Nice-to-have features:
  * As a user with a survey to share, I want **comprehensive visualization graphics and analysis** so that I get a good and concise idea of my survey results
  * As a user with a survey to share, I want **survey tagging and categorization** so that I can be more organized with my purpose and goals
  * As a user with a survey to share, I want a **survey search feature** so that I can view other surveys that I find interesting to answer or use
  * As a user with a survey to share, I want a **survey recommendation algorithm** so that I can have my survey shared to people that best matches the kind of people I’d like
* Non-functional requirements:
  * As a user with a survey to share, I want a **web app** to be able to use this software on my browser
  * As a user with a survey to share, I want **support for over 1000 users** so that a lot of people can view my survey without difficulty

## Software Architecture & Technology Stack
* Software Architecture
  * Standard Client Server Architecture
* Technology Stack
  * Firebase for our database
  * Express.js framework for our back-end and interaction with database
  * React library for our front-end 
  * Node.js


## Similar Apps
* Similar apps and software include:
  * Google Forms
  * SurveyMonkey
  * Typeform
  * Qualtrics
  * Microsoft Forms
* All of the above are mostly geared towards designing and creating a survey, but they don’t provide resources to get your survey to an audience. 
  * For instance, Google Forms will provide you a link for participants to answer your survey, but this does not mean Forms promotes your survey to others, meaning it’s up to the creator to conduct this responsibility. 
* We differ from these apps in that our entire platform advertises your surveys to other users through the survey coin currency on our platform, incentivizing people to answer surveys on our software if they want their surveys answered.