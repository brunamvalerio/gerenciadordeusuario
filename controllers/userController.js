class UserController {

    constructor (formIdCreate, formIdUpdate, tableId){

        this.formEl = document.getElementById(formIdCreate); // busca o ID passado e o armazena em 'this.tableEl'
        this.formUpdateEl = document.getElementById(formIdUpdate); 
        this.tableEl = document.getElementById(tableId); //Chama o método 'onSubmit'

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }

    onEdit(){

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {

            this.showPanelCreate();

        });

        this.formUpdateEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formUpdateEl.querySelector("[type=submit]")

            btn.disabled = true;

            let values = this.getValues(this.formUpdateEl);

            let index = this.formUpdateEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            this.getPhoto(this.formUpdateEl).then(
                (content) => {

                    if (!values.photo){ 
                        result._photo = userOld._photo;
                    } else {
                        result._photo = content;
                    }

                    let user = new User();

                    user.loadFromJSON(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();

                    this.formUpdateEl.reset();
            
                    this.showPanelCreate();

                    btn.disabled = false;

                }, 
                (e) => {
                    console.error(e)
                }
            );

        });

    }

    onSubmit(){

        this.formEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then(
                (content) => {

                    values.photo = content;

                    values.save();

                    this.addLine(values);

                    this.formEl.reset();

                    btn.disabled = false;

                }, 
                (e) => {
                    console.error(e)
                }
            );
        
        });

    }

    getPhoto(formEl){

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item => {

                if (item.name === 'photo') {
                    return item;
                }

            });

            let file = elements[0].files[0];

            fileReader.onload = () => {

                resolve(fileReader.result);

            };

            fileReader.onerror = (e) => {

                reject(e);

            };

            if(file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg');
            }

        });

    }

// Buscando os valores 
getValues(formEl){

    // Cria um objeto vazio para armazenar os dados do usuário
    let user = {};

    // Variável para verificar se o formulário é válido
    let isValid = true;

    // percorre todos os campos do formulário
    [...formEl.elements].forEach(function(field, index){

     
        if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

            // adiciona a página de erro caso algum campo obrigatório não seja preenchido 
            field.parentElement.classList.add("has-error");
           
            isValid = false;
        }

        if (field.name === "gender") {

            // Se o campo de gênero estiver marcado, armazena o valor selecionado
            if (field.checked) {
                user[field.name] = field.value;
            }

        } else if(field.name == "admin") {

            // Se o campo for 'admin', armazena se o checkbox está marcado (true ou false)
            user[field.name] = field.checked;

        } else {

            // Para os outros campos, armazena o valor preenchido
            user[field.name] = field.value;

        }

    });

    
    if (!isValid) {
        return false;
    }

    // Se o formulário estiver válido, cria um novo objeto User com os dados preenchidos
    return new User(
        user.name, 
        user.gender, 
        user.birth, 
        user.country, 
        user.email, 
        user.password, 
        user.photo, 
        user.admin
    );
}



getusersStorage () {

    // Inicializa um array vazio para armazenar os usuários
    let users = [];

    if (localStorage.getItem("users")) {

        // Se houver dados, converte a string JSON em um objeto JavaScript
        users = JSON.parse(localStorage.getItem("users"));
    }

    
    return users;
}

// Função para selecionar e carregar todos os usuários da lista armazenada
selectAll() {

    // let para obter a lista dos usuários 
    let users = this.getusersStorage();
    
    // Itera sobre cada usuário na lista
    users.forEach(dataUser => {

        
        let user = new User();

        // Carrega os dados do usuário no formato JSON para o objeto User
        user.loadFromJSON(dataUser);
    
        // Adiciona uma linha na tabela com os dados do usuário
        this.addLine(user);

    });
}


addLine(dataUser) {

  
    let tr = this.getTr(dataUser);

    this.tableEl.appendChild(tr);

    // Atualiza o contador de usuários e administradores
    this.updateCount();
}


    getTr(dataUser, tr = null) {
  // compara os valores e os tipos de dados 
        if (tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

  // Define o conteúdo HTML da linha da tabela (<tr>) com as informações do usuário
        tr.innerHTML = `
            <td><img src=${dataUser.photo} class="img-circle img-sm"></td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateFormat(dataUser.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);

        return tr

    }

    addEventsTr(tr) {

        tr.querySelector(".btn-delete").addEventListener("click", (e) => {

            if(confirm("Deseja relamente excluir?")) {

                tr.remove();

                this.updateCount();

            }

        });
// Adiciona um ouvinte de evento ao botão "Editar" dentro da linha de tabela (tr)
tr.querySelector(".btn-edit").addEventListener("click", e => {

    // os dados são convertidos dentro do JSON 
    let json = JSON.parse(tr.dataset.user);

    // Armazena o índice da linha da tabela no formulário de atualização para saber qual linha estamos editando
    this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

    
    for (let name in json) {

        // Encontra o campo correspondente no formulário de atualização, com base no nome do campo
        let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

        // SE o campo for encontrado o formulário é preenchido 
        if (field) {

            
            switch (field.type) {
                case 'file':
                    // Se o campo for de tipo 'file', ignora (não é possível preencher via código)
                    continue;
                    break;
                    
                case 'radio':
                    // Se o campo for de tipo 'radio', marca o botão de rádio correspondente ao valor armazenado
                    field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                    field.checked = true;
                break;

                case 'checkbox':
                    
                    field.checked = json[name];
                break;

                default:
                 
                    field.value = json[name];
            }
        }
    }

    // Atualiza a imagem de foto do usuário no formulário de atualização
    this.formUpdateEl.querySelector(".photo").src = json._photo;

    // Exibe o painel de atualização do formulário (provavelmente um modal ou uma seção visível)
    this.showPanelUpdate();
});


    }

showPanelCreate(){

    // Exibe o painel de criação de usuário
    document.querySelector("#box-user-create").style.display = "block";
    
    // Oculta o painel de atualização de usuário
    document.querySelector("#box-user-update").style.display = "none";
}

// 
showPanelUpdate(){

    document.querySelector("#box-user-create").style.display = "none";
    
    
    document.querySelector("#box-user-update").style.display = "block";
}

// Atualiza o número de usuários
updateCount(){

    // Iniciando as variáveis 
    let numberUsers = 0;
    let numberAdmin = 0;

    // Percorre todas as linhas da tabela (cada linha representa um usuário)
    [...this.tableEl.children].forEach(tr => {

        // Incrementa o contador de usuários
        numberUsers++;

        // Obtém os dados do usuário armazenados na linha 
        let user = JSON.parse(tr.dataset.user);

        // Se o usuário for administrador, incrementa o contador de administradores
        if (user._admin) numberAdmin++;
    })

    // Atualiza o número total de usuários exibido na página
    document.querySelector("#number-users").innerHTML = numberUsers;

    // Atualiza o número de administradores exibido na página
    document.querySelector("#number-users-admin").innerHTML = numberAdmin;
}

}
