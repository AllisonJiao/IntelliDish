# M3 - Requirements and Design

## 1. Change History
<!-- Leave blank for M3 -->
Left empty for this first version.

## 2. Project Description
Our app “IntelliDish - AI Powered Recipe Recommendations Taylored for your Stomach and Fridge” aims to solve challenges faced by people with busy schedules and limited access to diverse cooking ingredients. 

IntelliDish allows users to give a list of available ingredients to IntelliDish along with the type of cuisine they wish to cook (such as Chinese food, Italian food, etc.), and IntelliDish will return a number of recipes that are possible to create with the available ingredients. If no recipes can be made with the provided ingredients, IntelliDish will return recipes where ingredients are partially available and give suggestions to the users on additional ingredients to buy or possible ingredient replacements. Additionally, IntelliDish will also provide many useful features such as personalizing, gamifying cooking, and potluck (which allows multiple users to combine their available ingredients and search for recipes).

For users like busy university students and employees (who often lack the time, energy, cooking expertise, and recipe knowledge to plan meals), IntelliDish simplifies the meal preparation process by providing quick and desirable recipe suggestions using available ingredients. Additionally, for those with restricted ingredient options due to location or budget constraints, IntelliDish can maximize the value of available ingredients, allowing users to create desirable meals with limited access to diverse cooking ingredients.

<div style="display: flex; justify-content: space-between;">

<img src="images/IntelliDish_Day.png" alt="Image 1" width="45%" style="margin-right: 10px; border: 1px solid blue; padding: 5px; border-radius: 4px;">
<img src="images/IntelliDish_Night.png" alt="Image 2" width="45%" style="border: 1px solid blue; padding: 5px; border-radius: 4px;">

</div>


## 3. Requirements Specification
### **3.1. Use-Case Diagram**
![UML Use Case Diagram](images/UML%20Use%20Case%20Diagram.png)



### **3.2. Actors Description**
1. **User**  
   - The user provides the IntelliDish app with inputs such as available ingredients and cuisine preferences. The user can also manage their recipes and friends.  
   - For now, we have made the design choice that all users need to log in or be authenticated to use IntelliDish.  

2. **AI API**  
   - Provides possible recipes based on user input.  

3. **Authentication Service**  
   - Manages user login and authentication.  

4. **Admin**  
   - Manages users, backend server(s), and database(s).  



### **3.3. Functional Requirements**
<a name="fr1"></a>

**Overview**:
1. Login/ Authentication
2. ...
3. ...
4. ...
5. ...
6. ...

**Detailed Flow for Each Independent Scenario**:
1. **Login/ Authentication**:
    - **Description**: User logs in to IntelliDish using the authentication service with his/her credentials.
    - **Primary actor(s)**: User, Authentication Service.
    - **Main success scenario**:
        **1**. The user inputs his/her credentials into the authentication service log-in page.
        **2**. The authentication service system validates the user's credentials.
        **3**. The user successfully logs in to IntelliDish and starts using the system.
    - **Failure scenario(s)**:
        - **1a**: Authentication service is unreachable/ unavailable.
            - **1a1**: Display error message the authentication service is unreachable/ unavailable.
            - **1a2**: Prompt the user to try again later, or check online whether then authentication service is down/ under maintainence.
        - **2a**: Authentication service determines that user crendentials are invalid.
            - **2a1**: Display error message that credentials are invalid.
            - **2a2**: Prompt the user to try again.
            



### **3.4. Screen Mockups**


### **3.5. Non-Functional Requirements**
<a name="nfr1"></a>

1. **[WRITE_NAME_HERE]**
    - **Description**: ...
    - **Justification**: ...
2. ...


## 4. Designs Specification
### **4.1. Main Components**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
2. ...


### **4.2. Databases**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
2. ...


### **4.3. External Modules**
1. **[WRITE_NAME_HERE]** 
    - **Purpose**: ...
2. ...


### **4.4. Frameworks**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Reason**: ...
2. ...


### **4.5. Dependencies Diagram**


### **4.6. Functional Requirements Sequence Diagram**
1. [**[WRITE_NAME_HERE]**](#fr1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Non-Functional Requirements Design**
1. [**[WRITE_NAME_HERE]**](#nfr1)
    - **Validation**: ...
2. ...


### **4.8. Main Project Complexity Design**
**[WRITE_NAME_HERE]**
- **Description**: ...
- **Why complex?**: ...
- **Design**:
    - **Input**: ...
    - **Output**: ...
    - **Main computational logic**: ...
    - **Pseudo-code**: ...
        ```
        
        ```


## 5. Contributions
- ...
- ...
- ...
- ...
