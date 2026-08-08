```markdown
# AI Controller Documentation

## Overview

The `AiController` class is a central component in the application, handling various interactions with an AI service. It includes methods for chat and weather-related queries.

## Interfaces

### ChatDto

- **Description**: Data Transfer Object (DTO) used to encapsulate data related to a chat request.
- **Properties**:
- `message`: A string representing the user's message.

## Classes

### AiController

- **Description**: The main controller class responsible for handling AI-related operations.
- **Constructor**:
- **Parameters**:
  - `private readonly aiService: IAiService`: An instance of the AI service used to process requests.
- **Business Intent**: Initializes the controller with a reference to the AI service.

## Functions/Methods

### chat

- **Description**: Handles incoming chat requests and processes them using the AI service.
- **Parameters**:
- `@Body() dto: ChatDto`: The DTO containing the user's message.
- **Returns**: A promise resolving to an object with a `message` property containing the AI's response.
- **Business Intent**: Processes a chat request by sending it to the AI service and returning the response.

### aiWeather

- **Description**: Handles requests for weather information using the AI service.
- **Parameters**:
- `@Query() city: string`: The name of the city for which weather information is requested.
- **Returns**: A promise resolving to an object with a `weather` property containing the weather data.
- **Business Intent**: Fetches and returns weather information for a specified city using the AI service.
```
