pipeline {
    
    agent any
    environment {

        ENV_FILE = credentials('fithub-env-file')
        CERT_FILE = credentials('fithub-https-certificate')
        KEY_FILE = credentials('fithub-https-key')
    }
    
    stages {
        
        stage('Stop running server') {
            
            steps {
                
                script {
                    
                    dir("practice-app") {

                        try {
                            sh("docker compose down")
                        } catch (err) {
                            echo err.getMessage()
                        }
                    }
                }
            }
        }
        
        stage('Copy secrets') {
            steps {
                sh("cp $ENV_FILE practice-app/")
                sh("cp $CERT_FILE practice-app/backend/fithub")
                sh("cp $CERT_FILE practice-app/frontend")
                sh("cp $KEY_FILE practice-app/backend/fithub")
                sh("cp $KEY_FILE practice-app/frontend")
            }
        }
        
        stage('Compose build') {
            steps {
                dir("practice-app") {
                    sh("docker compose build")
                }
            }
        }
        
        stage('Compose up') {
            steps {
                dir("practice-app") {
                    sh("docker compose up -d")
                }
            }
        }
    }
}
