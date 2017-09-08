import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import gql from "graphql-tag";
import { graphql, compose } from "react-apollo";
import Auth0Lock from "auth0-lock";

const createUserQuery = gql`
  mutation($idToken: String!, $name: String!, $email: String!, $picture: String!) {
    createUser(
      auth0UserId: $idToken
      name: $name
      email: $email
      picture: $picture
    ) {
      id
    }
  }
`;

const userQuery = gql`
  query {
    user {
      id
    }
  }
`;

class LoginAuth0 extends Component {
  constructor(props) {
    super(props);
    this.createUser = props.createUser;
    this._lock = new Auth0Lock(props.clientId, props.domain);
  }

  componentDidMount() {
    const props = this.props;
    this._lock.on("authenticated", authResult => {
      window.localStorage.setItem(
        "cfd-members-auth0IdToken",
        authResult.idToken
      );
      props.data.refetch().then(({ data: { user } }) => {
        if (!user) {
          this._lock.getUserInfo(authResult.accessToken, (error, profile) => {
            const { name, email, picture } = profile;
            const idToken = window.localStorage.getItem(
              "cfd-members-auth0IdToken"
            );
            this.createUser({
              variables: {
                idToken,
                name,
                email,
                picture
              }
            });
          });
        } else {
          props.history.push("/");
        }
      });
    });
  }
  _showLogin = () => {
    this._lock.show();
  };

  render() {
    return <span onClick={this._showLogin}>Log in with Auth0</span>;
  }
}

export default compose(
  graphql(createUserQuery, {
    name: "createUser",
    options: {
      refetchQueries: [{ query: userQuery }]
    }
  }),
  graphql(userQuery, {
    options: {
      fetchPolicy: "network-only"
    }
  })
)(withRouter(LoginAuth0));
