# feup-thesis
Master Thesis in Informatics and Computing Engineering


## Getting Started

### Prerequisites
To run the application make sure you have `docker` and `docker-compose` installed.


### Running

1. Clone the repository
```shell
git clone https://github.com/rendoir/feup-thesis.git
cd feup-thesis/src/
```

2. Run the application
    - For deployment
    ```shell
    docker-compose up
    ```

    - For development
    ```shell
    docker-compose -f docker-compose.dev.yml up
    ```

3. Open your browser
    - In deployment
    ```
    http://127.0.0.1:8080/visualization/1/
    ```

    - In development
    ```
    http://127.0.0.1:8080/
    ```
