# feup-thesis
Master Thesis in Informatics and Computing Engineering

## Publications
### [Thesis](https://hdl.handle.net/10216/128548)  
Daniel Marques. Spatiotemporal phenomena summarization through static visual narratives. 2020.

### [Paper](https://ieeexplore.ieee.org/document/9373112)
D. Marques, A. V. de Carvalho, R. Rodrigues and E. Carneiro, "Spatiotemporal Phenomena Summarization through Static Visual Narratives", *2020 24th International Conference Information Visualisation (IV)*, 2020, pp. 467-472, doi: 10.1109/IV51561.2020.00081.

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
